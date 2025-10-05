import {
  billNotificationsQueue,
  DueNotificationJob,
} from "../billNotifications.queue";
import { prisma } from "@/lib/prisma";
import { getBillTypeIcon } from "@/lib/billTypes";
import axios from "axios";
import { BillType } from "@prisma/client";

const LINE_CHANNEL_ACCESS_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN!;
const LINE_MESSAGING_API_URL = "https://api.line.me/v2/bot/message/push";
const LIFF_ID = process.env.NEXT_PUBLIC_LIFF_ID || "default-liff-id";

interface Task {
  id: string;
  billId: string;
  userId: string;
  status: string;
  dueDate: Date;
  bill: {
    id: string;
    vendor: string;
    amount: number | string | { toNumber: () => number };
    billType: BillType;
  };
  user: {
    id: string;
    lineUserId: string | null;
  };
}

billNotificationsQueue.process(async (job) => {
  const { taskId, type } = job.data as DueNotificationJob;

  console.log(`Processing ${type} notification for task ${taskId}`);

  // Fetch task with related data
  const task = (await prisma.task.findUnique({
    where: { id: taskId },
    include: {
      bill: true,
      user: true,
    },
  })) as Task | null;

  if (!task) {
    throw new Error(`Task ${taskId} not found`);
  }

  // Skip if task already paid
  if (task.status === "PAID") {
    console.log(`Task ${taskId} already paid, skipping notification`);
    return { skipped: true, reason: "already_paid" };
  }

  // Get user's LINE ID
  if (!task.user.lineUserId) {
    throw new Error(`User ${task.userId} has no LINE ID`);
  }

  // Create notification record
  const notification = await prisma.notification.create({
    data: {
      userId: task.userId,
      taskId: task.id,
      type,
      status: "PENDING",
      message: `${type === "DUE_TODAY" ? "Bill due today" : "Bill due soon"}: ${
        task.bill.vendor
      }`,
      metadata: {
        billId: task.billId,
        taskId: task.id,
      },
    },
  });

  try {
    // Create Flex Message
    const message = createDueNotificationFlexMessage(task, type);

    // Send to LINE
    await axios.post(
      LINE_MESSAGING_API_URL,
      {
        to: task.user.lineUserId,
        messages: [message],
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${LINE_CHANNEL_ACCESS_TOKEN}`,
        },
      }
    );

    // Update notification status
    await prisma.notification.update({
      where: { id: notification.id },
      data: {
        status: "SENT",
        sentAt: new Date(),
      },
    });

    console.log(`✅ ${type} notification sent for task ${taskId}`);
    return { success: true, notificationId: notification.id };
  } catch (error) {
    // Update notification status to failed
    await prisma.notification.update({
      where: { id: notification.id },
      data: { status: "FAILED" },
    });

    // Re-throw to trigger Bull retry
    throw error;
  }
});

function createDueNotificationFlexMessage(task: Task, type: string) {
  const deepLink = `https://liff.line.me/${LIFF_ID}?path=/tasks/${task.id}`;
  const billTypeIcon = getBillTypeIcon(task.bill.billType);
  const amount = Number(task.bill.amount);
  const formattedAmount = `฿${amount.toLocaleString("th-TH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
  const formattedDate = new Date(task.dueDate).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  const title =
    type === "DUE_TODAY" ? "⚠️ Bill Due Today!" : "⏰ Bill Due Soon";
  const color = type === "DUE_TODAY" ? "#FF6B6B" : "#FFA500";

  return {
    type: "flex",
    altText: `${title}: ${task.bill.vendor}`,
    contents: {
      type: "bubble",
      body: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "text",
            text: title,
            weight: "bold",
            size: "xl",
            color,
          },
          {
            type: "box",
            layout: "vertical",
            margin: "lg",
            spacing: "sm",
            contents: [
              {
                type: "box",
                layout: "baseline",
                spacing: "sm",
                contents: [
                  {
                    type: "text",
                    text: billTypeIcon,
                    size: "xl",
                    flex: 0,
                  },
                  {
                    type: "text",
                    text: task.bill.vendor,
                    weight: "bold",
                    size: "lg",
                    flex: 1,
                  },
                ],
              },
              {
                type: "box",
                layout: "baseline",
                spacing: "sm",
                contents: [
                  {
                    type: "text",
                    text: "Amount:",
                    color: "#aaaaaa",
                    size: "sm",
                    flex: 1,
                  },
                  {
                    type: "text",
                    text: formattedAmount,
                    weight: "bold",
                    size: "md",
                    color: "#FF6B6B",
                    flex: 2,
                    align: "end",
                  },
                ],
              },
              {
                type: "box",
                layout: "baseline",
                spacing: "sm",
                contents: [
                  {
                    type: "text",
                    text: "Due Date:",
                    color: "#aaaaaa",
                    size: "sm",
                    flex: 1,
                  },
                  {
                    type: "text",
                    text: formattedDate,
                    size: "sm",
                    flex: 2,
                    align: "end",
                  },
                ],
              },
            ],
          },
        ],
      },
      footer: {
        type: "box",
        layout: "vertical",
        spacing: "sm",
        contents: [
          {
            type: "button",
            style: "primary",
            color: "#FF6B6B",
            action: {
              type: "uri",
              label: "Pay Now",
              uri: deepLink,
            },
          },
        ],
      },
    },
  };
}

// Graceful shutdown
process.on("SIGTERM", async () => {
  console.log("SIGTERM received, closing queue...");
  await billNotificationsQueue.close();
  process.exit(0);
});
