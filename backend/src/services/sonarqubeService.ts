import axios from "axios";
import { redis } from "../index";
import logger from "../utils/logger";

class SonarQubeService {
  private baseURL: string;
  private token: string;

  constructor() {
    this.baseURL = process.env.SONARQUBE_URL!;
    this.token = process.env.SONARQUBE_TOKEN!;
  }

  async getProjectMetrics(projectKey: string) {
    const cacheKey = `sonar:project:${projectKey}`;
    const cached = await redis.get(cacheKey);

    if (cached) return JSON.parse(cached);

    try {
      const metrics = [
        "bugs",
        "vulnerabilities",
        "code_smells",
        "coverage",
        "duplicated_lines_density",
        "ncloc",
        "sqale_rating",
        "reliability_rating",
        "security_rating",
        "sqale_index",
      ];

      const response = await axios.get(
        `${this.baseURL}/api/measures/component`,
        {
          params: {
            component: projectKey,
            metricKeys: metrics.join(","),
          },
          headers: {
            Authorization: `Bearer ${this.token}`,
          },
        }
      );

      const data = response.data.component.measures.reduce((acc, measure) => {
        acc[measure.metric] = measure.value;
        return acc;
      }, {});

      const formattedMetrics = {
        bugs: parseInt(data.bugs) || 0,
        vulnerabilities: parseInt(data.vulnerabilities) || 0,
        codeSmells: parseInt(data.code_smells) || 0,
        coverage: parseFloat(data.coverage) || 0,
        duplicatedLinesDensity: parseFloat(data.duplicated_lines_density) || 0,
        linesOfCode: parseInt(data.ncloc) || 0,
        maintainabilityRating: data.sqale_rating || "A",
        reliabilityRating: data.reliability_rating || "A",
        securityRating: data.security_rating || "A",
        technicalDebt: data.sqale_index || "0min",
      };

      await redis.setex(cacheKey, 3600, JSON.stringify(formattedMetrics)); // Cache for 1 hour
      return formattedMetrics;
    } catch (error) {
      logger.error("Error fetching SonarQube data:", error);
      throw error;
    }
  }

  async getProjectHistory(projectKey: string, days: number = 30) {
    const cacheKey = `sonar:history:${projectKey}:${days}`;
    const cached = await redis.get(cacheKey);

    if (cached) return JSON.parse(cached);

    try {
      const fromDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0];

      const response = await axios.get(
        `${this.baseURL}/api/measures/search_history`,
        {
          params: {
            component: projectKey,
            metrics: "bugs,vulnerabilities,code_smells,coverage",
            from: fromDate,
          },
          headers: {
            Authorization: `Bearer ${this.token}`,
          },
        }
      );

      const history = response.data.measures.reduce((acc, measure) => {
        acc[measure.metric] = measure.history.map((h) => ({
          date: h.date,
          value: parseFloat(h.value) || 0,
        }));
        return acc;
      }, {});

      await redis.setex(cacheKey, 3600, JSON.stringify(history));
      return history;
    } catch (error) {
      logger.error("Error fetching SonarQube history:", error);
      throw error;
    }
  }
}

export default new SonarQubeService();
