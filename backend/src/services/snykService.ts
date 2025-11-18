import axios from "axios";
import { redis } from "../index";
import logger from "../utils/logger";

class SnykService {
  private baseURL = "https://snyk.io/api/v1";
  private token: string;

  constructor() {
    this.token = process.env.SNYK_TOKEN!;
  }

  async getOrganizationProjects(orgId: string) {
    const cacheKey = `snyk:org:${orgId}:projects`;
    const cached = await redis.get(cacheKey);

    if (cached) return JSON.parse(cached);

    try {
      const response = await axios.get(
        `${this.baseURL}/org/${orgId}/projects`,
        {
          headers: {
            Authorization: `token ${this.token}`,
          },
        }
      );

      const projects = response.data.projects.map((project) => ({
        id: project.id,
        name: project.name,
        origin: project.origin,
        type: project.type,
        readOnly: project.readOnly,
        testFrequency: project.testFrequency,
      }));

      await redis.setex(cacheKey, 3600, JSON.stringify(projects)); // Cache for 1 hour
      return projects;
    } catch (error) {
      logger.error("Error fetching Snyk projects:", error);
      throw error;
    }
  }

  async getProjectVulnerabilities(orgId: string, projectId: string) {
    const cacheKey = `snyk:vulnerabilities:${orgId}:${projectId}`;
    const cached = await redis.get(cacheKey);

    if (cached) return JSON.parse(cached);

    try {
      const response = await axios.post(
        `${this.baseURL}/org/${orgId}/project/${projectId}/aggregated-issues`,
        {
          filters: {
            severities: ["high", "medium", "low"],
            types: ["vuln", "license"],
          },
        },
        {
          headers: {
            Authorization: `token ${this.token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const vulnerabilities = {
        high: response.data.issues.filter(
          (issue) => issue.issueData.severity === "high"
        ).length,
        medium: response.data.issues.filter(
          (issue) => issue.issueData.severity === "medium"
        ).length,
        low: response.data.issues.filter(
          (issue) => issue.issueData.severity === "low"
        ).length,
        total: response.data.issues.length,
        fixable: response.data.issues.filter(
          (issue) => issue.fixInfo?.isFixable
        ).length,
      };

      await redis.setex(cacheKey, 1800, JSON.stringify(vulnerabilities)); // Cache for 30 minutes
      return vulnerabilities;
    } catch (error) {
      logger.error("Error fetching Snyk vulnerabilities:", error);
      throw error;
    }
  }

  async getOrganizationSummary(orgId: string) {
    const cacheKey = `snyk:org:${orgId}:summary`;
    const cached = await redis.get(cacheKey);

    if (cached) return JSON.parse(cached);

    try {
      const projects = await this.getOrganizationProjects(orgId);
      let totalVulnerabilities = {
        high: 0,
        medium: 0,
        low: 0,
        total: 0,
        fixable: 0,
      };

      // Sample a few projects to avoid rate limits
      const sampleProjects = projects.slice(0, 5);

      for (const project of sampleProjects) {
        try {
          const vulns = await this.getProjectVulnerabilities(orgId, project.id);
          totalVulnerabilities.high += vulns.high;
          totalVulnerabilities.medium += vulns.medium;
          totalVulnerabilities.low += vulns.low;
          totalVulnerabilities.total += vulns.total;
          totalVulnerabilities.fixable += vulns.fixable;
        } catch (error) {
          logger.warn(
            `Error fetching vulnerabilities for project ${project.id}:`,
            error
          );
        }
      }

      const summary = {
        totalProjects: projects.length,
        sampledProjects: sampleProjects.length,
        vulnerabilities: totalVulnerabilities,
        projectTypes: projects.reduce((acc, project) => {
          acc[project.type] = (acc[project.type] || 0) + 1;
          return acc;
        }, {}),
      };

      await redis.setex(cacheKey, 1800, JSON.stringify(summary));
      return summary;
    } catch (error) {
      logger.error("Error fetching Snyk organization summary:", error);
      throw error;
    }
  }
}

export default new SnykService();
