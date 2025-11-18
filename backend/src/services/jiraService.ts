import { Version3Client } from "@atlassian/jira-pi-client";
import { prisma, redis } from "../index";
import logger from "../utils/logger";

class JiraService {
  private client: Version3Client;

  constructor() {
    this.client = new Version3Client({
      host: process.env.JIRA_HOST!,
      authentication: {
        basic: {
          email: process.env.JIRA_EMAIL!,
          apiToken: process.env.JIRA_TOKEN!,
        },
      },
    });
  }

  async getTeamPerformance(teamMembers: string[], days: number = 30) {
    const cacheKey = `jira:team:${teamMembers.join(",")}:${days}`;
    const cached = await redis.get(cacheKey);

    if (cached) return JSON.parse(cached);

    try {
      const endDate = new Date();
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

      const jql = `
        assignee in (${teamMembers.map((m) => `"${m}"`).join(",")}) 
        AND updated >= "${startDate.toISOString().split("T")[0]}"
        AND updated <= "${endDate.toISOString().split("T")[0]}"
      `;

      const searchResults =
        await this.client.issueSearch.searchForIssuesUsingJql({
          jql,
          fields: [
            "summary",
            "status",
            "assignee",
            "storyPoints",
            "created",
            "updated",
            "priority",
          ],
          maxResults: 1000,
        });

      const metrics = this.calculateMetrics(searchResults.issues || []);

      await redis.setex(cacheKey, 3600, JSON.stringify(metrics)); // Cache for 1 hour
      return metrics;
    } catch (error) {
      logger.error("Error fetching Jira data:", error);
      throw error;
    }
  }

  async getIndividualPerformance(userId: string, days: number = 30) {
    const cacheKey = `jira:user:${userId}:${days}`;
    const cached = await redis.get(cacheKey);

    if (cached) return JSON.parse(cached);

    try {
      const endDate = new Date();
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

      const jql = `
        assignee = "${userId}" 
        AND updated >= "${startDate.toISOString().split("T")[0]}"
      `;

      const searchResults =
        await this.client.issueSearch.searchForIssuesUsingJql({
          jql,
          fields: [
            "summary",
            "status",
            "storyPoints",
            "created",
            "updated",
            "priority",
            "timetracking",
          ],
          maxResults: 1000,
        });

      const metrics = {
        totalTickets: searchResults.issues?.length || 0,
        completedTickets:
          searchResults.issues?.filter(
            (issue) => issue.fields.status.statusCategory.key === "done"
          ).length || 0,
        totalStoryPoints:
          searchResults.issues?.reduce(
            (sum, issue) => sum + (issue.fields.customfield_10016 || 0),
            0
          ) || 0,
        averageCycleTime: this.calculateAverageCycleTime(
          searchResults.issues || []
        ),
        ticketsByPriority: this.groupByPriority(searchResults.issues || []),
        dailyProgress: this.calculateDailyProgress(
          searchResults.issues || [],
          days
        ),
      };

      await redis.setex(cacheKey, 3600, JSON.stringify(metrics));
      return metrics;
    } catch (error) {
      logger.error("Error fetching individual Jira data:", error);
      throw error;
    }
  }

  private calculateMetrics(issues: any[]) {
    return {
      totalIssues: issues.length,
      completedIssues: issues.filter(
        (issue) => issue.fields.status.statusCategory.key === "done"
      ).length,
      totalStoryPoints: issues.reduce(
        (sum, issue) => sum + (issue.fields.customfield_10016 || 0),
        0
      ),
      issuesByAssignee: this.groupByAssignee(issues),
      issuesByStatus: this.groupByStatus(issues),
      velocityTrend: this.calculateVelocityTrend(issues),
    };
  }

  private groupByAssignee(issues: any[]) {
    return issues.reduce((acc, issue) => {
      const assignee = issue.fields.assignee?.displayName || "Unassigned";
      if (!acc[assignee]) acc[assignee] = { count: 0, storyPoints: 0 };
      acc[assignee].count++;
      acc[assignee].storyPoints += issue.fields.customfield_10016 || 0;
      return acc;
    }, {});
  }

  private groupByStatus(issues: any[]) {
    return issues.reduce((acc, issue) => {
      const status = issue.fields.status.name;
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});
  }

  private groupByPriority(issues: any[]) {
    return issues.reduce((acc, issue) => {
      const priority = issue.fields.priority?.name || "None";
      acc[priority] = (acc[priority] || 0) + 1;
      return acc;
    }, {});
  }

  private calculateVelocityTrend(issues: any[]) {
    // Group by week and calculate completed story points
    const weeklyData = issues
      .filter((issue) => issue.fields.status.statusCategory.key === "done")
      .reduce((acc, issue) => {
        const week = this.getWeekKey(new Date(issue.fields.updated));
        if (!acc[week]) acc[week] = 0;
        acc[week] += issue.fields.customfield_10016 || 0;
        return acc;
      }, {});

    return Object.entries(weeklyData)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([week, points]) => ({ week, points }));
  }

  private calculateAverageCycleTime(issues: any[]) {
    const completedIssues = issues.filter(
      (issue) => issue.fields.status.statusCategory.key === "done"
    );
    if (completedIssues.length === 0) return 0;

    const totalCycleTime = completedIssues.reduce((sum, issue) => {
      const created = new Date(issue.fields.created);
      const completed = new Date(issue.fields.updated);
      return sum + (completed.getTime() - created.getTime());
    }, 0);

    return Math.round(
      totalCycleTime / completedIssues.length / (1000 * 60 * 60 * 24)
    ); // Days
  }

  private calculateDailyProgress(issues: any[], days: number) {
    const dailyData = {};
    for (let i = 0; i < days; i++) {
      const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const dateKey = date.toISOString().split("T")[0];
      dailyData[dateKey] = { completed: 0, created: 0 };
    }

    issues.forEach((issue) => {
      const createdDate = issue.fields.created.split("T")[0];
      const updatedDate = issue.fields.updated.split("T")[0];

      if (dailyData[createdDate]) {
        dailyData[createdDate].created++;
      }

      if (
        issue.fields.status.statusCategory.key === "done" &&
        dailyData[updatedDate]
      ) {
        dailyData[updatedDate].completed++;
      }
    });

    return Object.entries(dailyData)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, data]) => ({ date, ...data }));
  }

  private getWeekKey(date: Date) {
    const year = date.getFullYear();
    const week = Math.ceil(
      ((date.getTime() - new Date(year, 0, 1).getTime()) / 86400000 + 1) / 7
    );
    return `${year}-W${week.toString().padStart(2, "0")}`;
  }
}

export default new JiraService();
