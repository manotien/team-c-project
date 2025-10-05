import axios from "axios";
import { prisma } from "@/lib/prisma";
import { getBillTypeIcon } from "@/lib/billTypes";
import { BillType } from "@prisma/client";

const LINE_CHANNEL_ACCESS_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN!;
const LINE_MESSAGING_API_URL = "https://api.line.me/v2/bot/message/push";
const LIFF_ID = process.env.NEXT_PUBLIC_LINE_LIFF_ID || "default-liff-id";

interface Bill {
  id: string;
  vendor: string;
  amount: number | string | { toNumber: () => number }; // Prisma Decimal or number or string
  dueDate: Date;
  billType: BillType;
}

interface Task {
  id: string;
  billId: string;
}

export async function sendBillCreatedNotification(
  userId: string,
  lineUserId: string,
  bill: Bill,
  task: Task
) {
  let notification: { id: string } | null = null;

  try {
    // Create notification record
    notification = await prisma.notification.create({
      data: {
        userId,
        taskId: task.id,
        type: "BILL_CREATED",
        status: "PENDING",
        message: `Bill added: ${bill.vendor} - ฿${Number(bill.amount).toFixed(2)}`,
        metadata: {
          billId: bill.id,
          taskId: task.id,
        },
      },
    });

    // Format message
    const message = createBillCreatedFlexMessage(bill, task);

    // Send to LINE
    await axios.post(
      LINE_MESSAGING_API_URL,
      {
        to: lineUserId,
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

    console.log(`✅ LINE notification sent for task ${task.id}`);
    return { success: true, notificationId: notification.id };
  } catch (error) {
    console.error("❌ Failed to send LINE notification:", error);

    // Log failure but don't throw (non-blocking)
    if (notification) {
      await prisma.notification.update({
        where: { id: notification.id },
        data: { status: "FAILED" },
      });
    }

    return { success: false, error };
  }
}

function createBillCreatedFlexMessage(bill: Bill, task: Task) {
  const deepLink = `https://liff.line.me/${LIFF_ID}?path=/tasks/${task.id}`;
  const billTypeIcon = getBillTypeIcon(bill.billType);
  const formattedAmount = `฿${Number(bill.amount).toLocaleString("th-TH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
  const formattedDate = new Date(bill.dueDate).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return {
    type: "flex",
    altText: `Bill added: ${bill.vendor}`,
    contents: {
      type: "bubble",
      body: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "text",
            text: "✅ Bill Added",
            weight: "bold",
            size: "xl",
            color: "#1DB446",
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
                    text: bill.vendor,
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
            action: {
              type: "uri",
              label: "View Task",
              uri: deepLink,
            },
          },
        ],
      },
    },
  };
}
