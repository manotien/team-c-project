import Bull from "bull";

const redisConfig = {
  host: process.env.REDIS_HOST || "localhost",
  port: parseInt(process.env.REDIS_PORT || "6379"),
  maxRetriesPerRequest: null,
};

export const billNotificationsQueue = new Bull("billNotifications", {
  redis: redisConfig,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 2000, // 2s, 4s, 8s
    },
    removeOnComplete: true,
    removeOnFail: false,
  },
});

// Job types
export interface DueNotificationJob {
  taskId: string;
  type: "DUE_SOON" | "DUE_TODAY";
}
