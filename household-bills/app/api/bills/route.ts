import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { BillType, Prisma } from "@prisma/client";

export const runtime = "nodejs";

interface CreateBillRequest {
  vendor: string;
  amount: number;
  currency?: string;
  dueDate: string;
  billType: string;
  imagePath: string;
  assigneeId: string;
  ocrData?: Prisma.InputJsonValue;
}

interface CreateBillResponse {
  success: boolean;
  message?: string;
  data?: {
    billId: string;
    taskId: string;
  };
  error?: string;
}

/**
 * POST /api/bills
 * Create a new bill and associated task
 */
export async function POST(request: NextRequest) {
  try {
    const body: CreateBillRequest = await request.json();

    // Validate required fields
    if (!body.amount || body.amount <= 0) {
      return NextResponse.json<CreateBillResponse>(
        {
          success: false,
          error: "Amount is required and must be greater than 0",
        },
        { status: 400 }
      );
    }

    if (!body.dueDate) {
      return NextResponse.json<CreateBillResponse>(
        {
          success: false,
          error: "Due date is required",
        },
        { status: 400 }
      );
    }

    if (!body.imagePath) {
      return NextResponse.json<CreateBillResponse>(
        {
          success: false,
          error: "Image path is required",
        },
        { status: 400 }
      );
    }

    if (!body.assigneeId) {
      return NextResponse.json<CreateBillResponse>(
        {
          success: false,
          error: "Assignee is required",
        },
        { status: 400 }
      );
    }

    // Validate bill type
    const validBillTypes = Object.values(BillType);
    const billType = (body.billType?.toUpperCase() || "OTHER") as BillType;
    if (!validBillTypes.includes(billType)) {
      return NextResponse.json<CreateBillResponse>(
        {
          success: false,
          error: `Invalid bill type. Must be one of: ${validBillTypes.join(", ")}`,
        },
        { status: 400 }
      );
    }

    // Parse due date
    const dueDate = new Date(body.dueDate);
    if (isNaN(dueDate.getTime())) {
      return NextResponse.json<CreateBillResponse>(
        {
          success: false,
          error: "Invalid due date format",
        },
        { status: 400 }
      );
    }

    // Create bill and task in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create bill
      const bill = await tx.bill.create({
        data: {
          userId: body.assigneeId,
          vendor: body.vendor || "Unknown",
          amount: body.amount,
          currency: body.currency || "THB",
          dueDate,
          billType,
          rawImageUrl: body.imagePath,
          ocrData: body.ocrData || {},
        },
      });

      // Create task with title format: "Pay {vendor} bill"
      const taskTitle = `Pay ${body.vendor || "Unknown"} bill`;

      const task = await tx.task.create({
        data: {
          billId: bill.id,
          userId: body.assigneeId,
          title: taskTitle,
          status: "UNPAID",
          dueDate,
        },
      });

      return { bill, task };
    });

    return NextResponse.json<CreateBillResponse>({
      success: true,
      message: "Bill and task created",
      data: {
        billId: result.bill.id,
        taskId: result.task.id,
      },
    });
  } catch (error) {
    console.error("Bill creation error:", error);

    return NextResponse.json<CreateBillResponse>(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to create bill",
      },
      { status: 500 }
    );
  }
}
