import express from "express";
import jiraService from "../services/jiraService";
import githubService from "../services/githubService";
import sonarqubeService from "../services/sonarqubeService";
import snykService from "../services/snykService";
import slackService from "../services/slackService";
import logger from "../utils/logger";

const router = express.Router();

router.get("/overview", async (req, res) => {
  try {
    const { teamMembers, days = 30 } = req.query;
    const members = Array.isArray(teamMembers) ? teamMembers : [teamMembers];

    const [
      jiraMetrics,
      githubMetrics,
      sonarMetrics,
      snykMetrics,
      slackMetrics,
    ] = await Promise.allSettled([
      jiraService.getTeamPerformance(members, parseInt(days)),
      githubService.getPullRequestMetrics(
        process.env.GITHUB_OWNER!,
        process.env.GITHUB_REPO!,
        parseInt(days)
      ),
      sonarqubeService.getProjectMetrics(process.env.SONARQUBE_PROJECT!),
      snykService.getOrganizationSummary(process.env.SNYK_ORG_ID!),
      slackService.getTeamActivity(members, parseInt(days)),
    ]);

    const dashboard = {
      jira: jiraMetrics.status === "fulfilled" ? jiraMetrics.value : null,
      github: githubMetrics.status === "fulfilled" ? githubMetrics.value : null,
      sonarqube:
        sonarMetrics.status === "fulfilled" ? sonarMetrics.value : null,
      snyk: snykMetrics.status === "fulfilled" ? snykMetrics.value : null,
      slack: slackMetrics.status === "fulfilled" ? slackMetrics.value : null,
      errors: [
        jiraMetrics.status === "rejected"
          ? { service: "jira", error: jiraMetrics.reason.message }
          : null,
        githubMetrics.status === "rejected"
          ? { service: "github", error: githubMetrics.reason.message }
          : null,
        sonarMetrics.status === "rejected"
          ? { service: "sonarqube", error: sonarMetrics.reason.message }
          : null,
        snykMetrics.status === "rejected"
          ? { service: "snyk", error: snykMetrics.reason.message }
          : null,
        slackMetrics.status === "rejected"
          ? { service: "slack", error: slackMetrics.reason.message }
          : null,
      ].filter(Boolean),
    };

    res.json(dashboard);
  } catch (error) {
    logger.error("Dashboard overview error:", error);
    res.status(500).json({ error: "Failed to fetch dashboard data" });
  }
});

router.get("/individual/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const { days = 30 } = req.query;

    const [jiraMetrics, githubMetrics, slackPresence] =
      await Promise.allSettled([
        jiraService.getIndividualPerformance(userId, parseInt(days)),
        githubService.getPullRequestMetrics(
          process.env.GITHUB_OWNER!,
          process.env.GITHUB_REPO!,
          parseInt(days)
        ),
        slackService.getUserPresence(userId),
      ]);

    const individual = {
      userId,
      jira: jiraMetrics.status === "fulfilled" ? jiraMetrics.value : null,
      github: githubMetrics.status === "fulfilled" ? githubMetrics.value : null,
      slack: slackPresence.status === "fulfilled" ? slackPresence.value : null,
      errors: [
        jiraMetrics.status === "rejected"
          ? { service: "jira", error: jiraMetrics.reason.message }
          : null,
        githubMetrics.status === "rejected"
          ? { service: "github", error: githubMetrics.reason.message }
          : null,
        slackPresence.status === "rejected"
          ? { service: "slack", error: slackPresence.reason.message }
          : null,
      ].filter(Boolean),
    };

    res.json(individual);
  } catch (error) {
    logger.error("Individual dashboard error:", error);
    res.status(500).json({ error: "Failed to fetch individual data" });
  }
});

export default router;
