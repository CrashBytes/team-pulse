import { WebClient } from "@slack/web-api";
import { redis } from "../index";
import logger from "../utils/logger";

class SlackService {
  private client: WebClient;

  constructor() {
    this.client = new WebClient(process.env.SLACK_TOKEN);
  }

  async getChannelActivity(channelId: string, days: number = 30) {
    const cacheKey = `slack:channel:${channelId}:${days}`;
    const cached = await redis.get(cacheKey);

    if (cached) return JSON.parse(cached);

    try {
      const oldest = Math.floor(
        (Date.now() - days * 24 * 60 * 60 * 1000) / 1000
      );

      const result = await this.client.conversations.history({
        channel: channelId,
        oldest: oldest.toString(),
        limit: 1000,
      });

      if (!result.messages) return { totalMessages: 0, messagesByUser: {} };

      const messages = result.messages.filter(
        (msg) => msg.type === "message" && !msg.bot_id
      );

      const messagesByUser = messages.reduce((acc, message) => {
        const user = message.user || "unknown";
        acc[user] = (acc[user] || 0) + 1;
        return acc;
      }, {});

      const dailyActivity = this.calculateDailyActivity(messages, days);

      const metrics = {
        totalMessages: messages.length,
        messagesByUser,
        dailyActivity,
        averageMessagesPerDay: Math.round(messages.length / days),
        mostActiveUsers: Object.entries(messagesByUser)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 10),
      };

      await redis.setex(cacheKey, 1800, JSON.stringify(metrics)); // Cache for 30 minutes
      return metrics;
    } catch (error) {
      logger.error("Error fetching Slack channel activity:", error);
      throw error;
    }
  }

  async getUserPresence(userId: string) {
    const cacheKey = `slack:presence:${userId}`;
    const cached = await redis.get(cacheKey);

    if (cached) return JSON.parse(cached);

    try {
      const result = await this.client.users.getPresence({
        user: userId,
      });

      const presence = {
        presence: result.presence,
        online: result.online,
        autoAway: result.auto_away,
        manualAway: result.manual_away,
        connectionCount: result.connection_count,
        lastActivity: result.last_activity,
      };

      await redis.setex(cacheKey, 300, JSON.stringify(presence)); // Cache for 5 minutes
      return presence;
    } catch (error) {
      logger.error("Error fetching Slack user presence:", error);
      throw error;
    }
  }

  async getTeamActivity(userIds: string[], days: number = 30) {
    const cacheKey = `slack:team:${userIds.join(",")}:${days}`;
    const cached = await redis.get(cacheKey);

    if (cached) return JSON.parse(cached);

    try {
      // Get all channels the bot is in
      const channelsResult = await this.client.conversations.list({
        types: "public_channel,private_channel",
        limit: 100,
      });

      let totalActivity = {};
      const channels = channelsResult.channels || [];

      // Sample a few channels to avoid rate limits
      for (const channel of channels.slice(0, 5)) {
        if (channel.id) {
          try {
            const activity = await this.getChannelActivity(channel.id, days);
            Object.entries(activity.messagesByUser).forEach(([user, count]) => {
              if (userIds.includes(user)) {
                totalActivity[user] = (totalActivity[user] || 0) + count;
              }
            });
          } catch (error) {
            logger.warn(
              `Error fetching activity for channel ${channel.id}:`,
              error
            );
          }
        }
      }

      const metrics = {
        totalTeamMessages: Object.values(totalActivity).reduce(
          (sum, count) => sum + count,
          0
        ),
        messagesByUser: totalActivity,
        activeUsers: Object.keys(totalActivity).length,
        averageMessagesPerUser:
          Object.values(totalActivity).length > 0
            ? Math.round(
                Object.values(totalActivity).reduce(
                  (sum, count) => sum + count,
                  0
                ) / Object.values(totalActivity).length
              )
            : 0,
      };

      await redis.setex(cacheKey, 1800, JSON.stringify(metrics));
      return metrics;
    } catch (error) {
      logger.error("Error fetching team Slack activity:", error);
      throw error;
    }
  }

  private calculateDailyActivity(messages: any[], days: number) {
    const dailyData = {};
    for (let i = 0; i < days; i++) {
      const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0];
      dailyData[date] = 0;
    }

    messages.forEach((message) => {
      const date = new Date(parseFloat(message.ts) * 1000)
        .toISOString()
        .split("T")[0];
      if (dailyData[date] !== undefined) {
        dailyData[date]++;
      }
    });

    return Object.entries(dailyData)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, count]) => ({ date, count }));
  }
}

export default new SlackService();
