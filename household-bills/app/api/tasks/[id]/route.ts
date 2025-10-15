import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { TaskStatus } from "@prisma/client";
import { cancelTaskNotifications } from "@/lib/services/notificationScheduler";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const task = await prisma.task.findUnique({
    where: {
      id,
      userId: session.user.id, // Ensure user owns task
    },
    include: {
      bill: true,
    },
  });

  if (!task) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  return NextResponse.json(task);
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { status, paymentProofUrl } = body;

  // Validate status
  if (status && !["UNPAID", "PAID"].includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  // Build update data
  const updateData: {
    status?: TaskStatus;
    paidAt?: Date;
    paymentProofUrl?: string | null;
  } = {};
  if (status) {
    updateData.status = status as TaskStatus;
    if (status === "PAID") {
      updateData.paidAt = new Date();
    }
  }
  if (paymentProofUrl !== undefined) {
    updateData.paymentProofUrl = paymentProofUrl;
  }

  try {
    const task = await prisma.task.update({
      where: {
        id,
        userId: session.user.id, // Ensure user owns task
      },
      data: updateData,
      include: {
        bill: true,
      },
    });

    // Cancel scheduled notifications if task marked as paid
    if (status === "PAID") {
      await cancelTaskNotifications(id);
    }

    return NextResponse.json({
      message: status === "PAID" ? "Task marked as paid" : "Task updated",
      task,
    });
  } catch (error) {
    console.error("Error updating task:", error);
    return NextResponse.json(
      { error: "Failed to update task" },
      { status: 500 }
    );
  }
}
