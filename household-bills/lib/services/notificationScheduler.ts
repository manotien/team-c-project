import { billNotificationsQueue } from "../queues/billNotifications.queue";

export async function scheduleTaskNotifications(taskId: string, dueDate: Date) {
  const now = new Date();
  const dueDateMs = dueDate.getTime();
  const nowMs = now.getTime();

  // Schedule DUE_TODAY notification (at due date)
  if (dueDateMs > nowMs) {
    const delay = dueDateMs - nowMs;
    await billNotificationsQueue.add(
      { taskId, type: "DUE_TODAY" },
      {
        delay,
        jobId: `due-today-${taskId}`, // Unique job ID for deduplication
      }
    );
    console.log(
      `Scheduled DUE_TODAY notification for task ${taskId} in ${delay}ms`
    );
  }

  // Schedule DUE_SOON notification (1 day before due date)
  const oneDayBeforeMs = dueDateMs - 24 * 60 * 60 * 1000;
  if (oneDayBeforeMs > nowMs) {
    const delay = oneDayBeforeMs - nowMs;
    await billNotificationsQueue.add(
      { taskId, type: "DUE_SOON" },
      {
        delay,
        jobId: `due-soon-${taskId}`,
      }
    );
    console.log(
      `Scheduled DUE_SOON notification for task ${taskId} in ${delay}ms`
    );
  }
}

export async function cancelTaskNotifications(taskId: string) {
  // Remove pending notification jobs
  await billNotificationsQueue.removeJobs(`due-today-${taskId}`);
  await billNotificationsQueue.removeJobs(`due-soon-${taskId}`);
  console.log(`Cancelled notifications for task ${taskId}`);
}
