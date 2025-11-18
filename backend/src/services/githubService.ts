import { Octokit } from "@octokit/rest";
import { redis } from "../index";
import logger from "../utils/logger";

class GitHubService {
  private octokit: Octokit;

  constructor() {
    this.octokit = new Octokit({
      auth: process.env.GITHUB_TOKEN,
    });
  }

  async getPullRequestMetrics(owner: string, repo: string, days: number = 30) {
    const cacheKey = `github:pr:${owner}:${repo}:${days}`;
    const cached = await redis.get(cacheKey);

    if (cached) return JSON.parse(cached);

    try {
      const since = new Date(
        Date.now() - days * 24 * 60 * 60 * 1000
      ).toISOString();

      const { data: pullRequests } = await this.octokit.pulls.list({
        owner,
        repo,
        state: "all",
        sort: "updated",
        direction: "desc",
        per_page: 100,
      });

      const recentPRs = pullRequests.filter(
        (pr) => new Date(pr.updated_at) >= new Date(since)
      );

      const metrics = {
        totalPRs: recentPRs.length,
        openPRs: recentPRs.filter((pr) => pr.state === "open").length,
        mergedPRs: recentPRs.filter((pr) => pr.merged_at).length,
        closedPRs: recentPRs.filter(
          (pr) => pr.state === "closed" && !pr.merged_at
        ).length,
        averageReviewTime: await this.calculateAverageReviewTime(
          owner,
          repo,
          recentPRs
        ),
        prsByAuthor: this.groupPRsByAuthor(recentPRs),
        dailyPRActivity: this.calculateDailyPRActivity(recentPRs, days),
      };

      await redis.setex(cacheKey, 1800, JSON.stringify(metrics)); // Cache for 30 minutes
      return metrics;
    } catch (error) {
      logger.error("Error fetching GitHub PR data:", error);
      throw error;
    }
  }

  async getCodeReviewMetrics(owner: string, repo: string, days: number = 30) {
    const cacheKey = `github:reviews:${owner}:${repo}:${days}`;
    const cached = await redis.get(cacheKey);

    if (cached) return JSON.parse(cached);

    try {
      const since = new Date(
        Date.now() - days * 24 * 60 * 60 * 1000
      ).toISOString();

      const { data: pullRequests } = await this.octokit.pulls.list({
        owner,
        repo,
        state: "all",
        sort: "updated",
        direction: "desc",
        per_page: 50,
      });

      let allReviews = [];
      for (const pr of pullRequests.slice(0, 20)) {
        // Limit to avoid rate limits
        const { data: reviews } = await this.octokit.pulls.listReviews({
          owner,
          repo,
          pull_number: pr.number,
        });
        allReviews.push(
          ...reviews.map((review) => ({ ...review, prNumber: pr.number }))
        );
      }

      const recentReviews = allReviews.filter(
        (review) => new Date(review.submitted_at) >= new Date(since)
      );

      const metrics = {
        totalReviews: recentReviews.length,
        approvedReviews: recentReviews.filter((r) => r.state === "APPROVED")
          .length,
        requestedChanges: recentReviews.filter(
          (r) => r.state === "CHANGES_REQUESTED"
        ).length,
        reviewsByReviewer: this.groupReviewsByReviewer(recentReviews),
        averageReviewsPerPR:
          allReviews.length / Math.max(pullRequests.length, 1),
      };

      await redis.setex(cacheKey, 1800, JSON.stringify(metrics));
      return metrics;
    } catch (error) {
      logger.error("Error fetching GitHub review data:", error);
      throw error;
    }
  }

  private async calculateAverageReviewTime(
    owner: string,
    repo: string,
    prs: any[]
  ) {
    let totalTime = 0;
    let count = 0;

    for (const pr of prs.slice(0, 10)) {
      // Sample to avoid rate limits
      try {
        const { data: reviews } = await this.octokit.pulls.listReviews({
          owner,
          repo,
          pull_number: pr.number,
        });

        if (reviews.length > 0) {
          const firstReview = reviews.sort(
            (a, b) =>
              new Date(a.submitted_at).getTime() -
              new Date(b.submitted_at).getTime()
          )[0];

          const prCreated = new Date(pr.created_at).getTime();
          const firstReviewTime = new Date(firstReview.submitted_at).getTime();

          totalTime += firstReviewTime - prCreated;
          count++;
        }
      } catch (error) {
        logger.warn(`Error fetching reviews for PR ${pr.number}:`, error);
      }
    }

    return count > 0 ? Math.round(totalTime / count / (1000 * 60 * 60)) : 0; // Hours
  }

  private groupPRsByAuthor(prs: any[]) {
    return prs.reduce((acc, pr) => {
      const author = pr.user.login;
      if (!acc[author]) acc[author] = { count: 0, merged: 0 };
      acc[author].count++;
      if (pr.merged_at) acc[author].merged++;
      return acc;
    }, {});
  }

  private groupReviewsByReviewer(reviews: any[]) {
    return reviews.reduce((acc, review) => {
      const reviewer = review.user.login;
      if (!acc[reviewer])
        acc[reviewer] = { count: 0, approved: 0, changesRequested: 0 };
      acc[reviewer].count++;
      if (review.state === "APPROVED") acc[reviewer].approved++;
      if (review.state === "CHANGES_REQUESTED")
        acc[reviewer].changesRequested++;
      return acc;
    }, {});
  }

  private calculateDailyPRActivity(prs: any[], days: number) {
    const dailyData = {};
    for (let i = 0; i < days; i++) {
      const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0];
      dailyData[date] = { created: 0, merged: 0, closed: 0 };
    }

    prs.forEach((pr) => {
      const createdDate = pr.created_at.split("T")[0];
      if (dailyData[createdDate]) {
        dailyData[createdDate].created++;
      }

      if (pr.merged_at) {
        const mergedDate = pr.merged_at.split("T")[0];
        if (dailyData[mergedDate]) {
          dailyData[mergedDate].merged++;
        }
      } else if (pr.closed_at) {
        const closedDate = pr.closed_at.split("T")[0];
        if (dailyData[closedDate]) {
          dailyData[closedDate].closed++;
        }
      }
    });

    return Object.entries(dailyData)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, data]) => ({ date, ...data }));
  }
}

export default new GitHubService();
