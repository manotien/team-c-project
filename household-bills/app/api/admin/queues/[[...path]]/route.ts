import { billNotificationsQueue } from "@/lib/queues/billNotifications.queue";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createBullBoard } from "@bull-board/api";
import { BullAdapter } from "@bull-board/api/bullAdapter";
import { NextJsAdapter } from "@/lib/bull-board/NextJsAdapter";

// Setup Bull Board
const serverAdapter = new NextJsAdapter();
serverAdapter.setBasePath("/api/admin/queues");

createBullBoard({
  queues: [new BullAdapter(billNotificationsQueue)],
  serverAdapter,
  options: {
    uiConfig: {
      boardTitle: "Bill Notifications Queue",
    },
  },
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path?: string[] }> }
) {
  const { path = [] } = await params;
  const pathname = path.join("/") || "index.html";

  // Manual trigger API endpoints (keep existing functionality)
  if (pathname === "api/tasks") {
    const tasks = await prisma.task.findMany({
      where: { status: "UNPAID" },
      include: { bill: true },
      orderBy: { dueDate: "asc" },
      take: 50,
    });

    return NextResponse.json({
      tasks: tasks.map((task) => ({
        id: task.id,
        vendor: task.bill.vendor,
        dueDate: task.dueDate,
        amount: Number(task.bill.amount),
      })),
    });
  }

  // Delegate to Bull Board adapter
  return serverAdapter.handleRequest(request, await params);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path?: string[] }> }
) {
  const { path = [] } = await params;
  const pathname = path.join("/");

  // Manual trigger endpoint (keep existing functionality)
  if (pathname === "api/trigger") {
    const body = await request.json();
    const { taskId, type } = body;

    if (!taskId || !type) {
      return NextResponse.json(
        { error: "taskId and type are required" },
        { status: 400 }
      );
    }

    if (type !== "DUE_SOON" && type !== "DUE_TODAY") {
      return NextResponse.json(
        { error: "type must be DUE_SOON or DUE_TODAY" },
        { status: 400 }
      );
    }

    // Verify task exists
    const task = await prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Add job to queue immediately (no delay)
    const job = await billNotificationsQueue.add(
      { taskId, type },
      {
        jobId: `manual-${type.toLowerCase()}-${taskId}-${Date.now()}`,
      }
    );

    return NextResponse.json({
      success: true,
      jobId: job.id,
      message: `Job queued successfully for task ${taskId}`,
    });
  }

  // Delegate to Bull Board adapter
  return serverAdapter.handleRequest(request, await params);
}
