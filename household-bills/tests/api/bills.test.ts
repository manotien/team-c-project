import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/bills/route";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

// Mock Prisma
vi.mock("@/lib/prisma", () => ({
  prisma: {
    $transaction: vi.fn(),
  },
}));

describe("POST /api/bills - Automatic Task Creation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should create bill and task in transaction with correct task title format", async () => {
    const mockBill = {
      id: "bill-123",
      userId: "user-123",
      vendor: "MEA Electric",
      amount: 1230,
      currency: "THB",
      dueDate: new Date("2025-10-05"),
      billType: "ELECTRIC",
      rawImageUrl: "/uploads/test.jpg",
      ocrData: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const mockTask = {
      id: "task-123",
      billId: "bill-123",
      userId: "user-123",
      title: "Pay MEA Electric bill",
      status: "UNPAID",
      dueDate: new Date("2025-10-05"),
      paidAt: null,
      paymentProofUrl: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Mock transaction
    vi.mocked(prisma.$transaction).mockResolvedValue({
      bill: mockBill,
      task: mockTask,
    });

    const request = new NextRequest("http://localhost:3000/api/bills", {
      method: "POST",
      body: JSON.stringify({
        vendor: "MEA Electric",
        amount: 1230,
        currency: "THB",
        dueDate: "2025-10-05",
        billType: "ELECTRIC",
        imagePath: "/uploads/test.jpg",
        assigneeId: "user-123",
        ocrData: {},
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.message).toBe("Bill and task created");
    expect(data.data).toEqual({
      billId: "bill-123",
      taskId: "task-123",
    });
    expect(prisma.$transaction).toHaveBeenCalledOnce();
  });

  it("should set task status to UNPAID by default", async () => {
    const mockBill = {
      id: "bill-123",
      userId: "user-123",
      vendor: "Waterworks",
      amount: 560,
      currency: "THB",
      dueDate: new Date("2025-10-08"),
      billType: "WATER",
      rawImageUrl: "/uploads/test.jpg",
      ocrData: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const mockTask = {
      id: "task-123",
      billId: "bill-123",
      userId: "user-123",
      title: "Pay Waterworks bill",
      status: "UNPAID",
      dueDate: new Date("2025-10-08"),
      paidAt: null,
      paymentProofUrl: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    vi.mocked(prisma.$transaction).mockResolvedValue({
      bill: mockBill,
      task: mockTask,
    });

    const request = new NextRequest("http://localhost:3000/api/bills", {
      method: "POST",
      body: JSON.stringify({
        vendor: "Waterworks",
        amount: 560,
        currency: "THB",
        dueDate: "2025-10-08",
        billType: "WATER",
        imagePath: "/uploads/test.jpg",
        assigneeId: "user-123",
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });

  it("should copy due date from bill to task", async () => {
    const dueDate = new Date("2025-10-15");
    const mockBill = {
      id: "bill-123",
      userId: "user-123",
      vendor: "Internet",
      amount: 799,
      currency: "THB",
      dueDate,
      billType: "INTERNET",
      rawImageUrl: "/uploads/test.jpg",
      ocrData: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const mockTask = {
      id: "task-123",
      billId: "bill-123",
      userId: "user-123",
      title: "Pay Internet bill",
      status: "UNPAID",
      dueDate,
      paidAt: null,
      paymentProofUrl: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    vi.mocked(prisma.$transaction).mockResolvedValue({
      bill: mockBill,
      task: mockTask,
    });

    const request = new NextRequest("http://localhost:3000/api/bills", {
      method: "POST",
      body: JSON.stringify({
        vendor: "Internet",
        amount: 799,
        currency: "THB",
        dueDate: "2025-10-15",
        billType: "INTERNET",
        imagePath: "/uploads/test.jpg",
        assigneeId: "user-123",
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });

  it("should rollback transaction if task creation fails", async () => {
    vi.mocked(prisma.$transaction).mockRejectedValue(
      new Error("Task creation failed")
    );

    const request = new NextRequest("http://localhost:3000/api/bills", {
      method: "POST",
      body: JSON.stringify({
        vendor: "Test Vendor",
        amount: 100,
        currency: "THB",
        dueDate: "2025-10-05",
        billType: "OTHER",
        imagePath: "/uploads/test.jpg",
        assigneeId: "user-123",
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toBeTruthy();
  });

  it("should validate required amount field", async () => {
    const request = new NextRequest("http://localhost:3000/api/bills", {
      method: "POST",
      body: JSON.stringify({
        vendor: "Test",
        amount: 0,
        dueDate: "2025-10-05",
        billType: "OTHER",
        imagePath: "/uploads/test.jpg",
        assigneeId: "user-123",
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toContain("Amount");
  });

  it("should validate required dueDate field", async () => {
    const request = new NextRequest("http://localhost:3000/api/bills", {
      method: "POST",
      body: JSON.stringify({
        vendor: "Test",
        amount: 100,
        billType: "OTHER",
        imagePath: "/uploads/test.jpg",
        assigneeId: "user-123",
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toContain("Due date");
  });

  it("should validate required imagePath field", async () => {
    const request = new NextRequest("http://localhost:3000/api/bills", {
      method: "POST",
      body: JSON.stringify({
        vendor: "Test",
        amount: 100,
        dueDate: "2025-10-05",
        billType: "OTHER",
        assigneeId: "user-123",
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toContain("Image path");
  });

  it("should validate required assigneeId field", async () => {
    const request = new NextRequest("http://localhost:3000/api/bills", {
      method: "POST",
      body: JSON.stringify({
        vendor: "Test",
        amount: 100,
        dueDate: "2025-10-05",
        billType: "OTHER",
        imagePath: "/uploads/test.jpg",
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toContain("Assignee");
  });
});
