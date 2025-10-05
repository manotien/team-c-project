"use client";

import Link from "next/link";
import Image from "next/image";
import { formatCurrency, formatDate } from "@/lib/utils";
import { getBillTypeIcon } from "@/lib/billTypes";
import { BillType } from "@prisma/client";

interface Task {
  id: string;
  status: string;
  dueDate: Date;
  paidAt: Date | null;
  paymentProofUrl: string | null;
  bill: {
    vendor: string;
    amount: number;
    billType: BillType;
  };
}

interface TaskHistoryProps {
  tasks: Task[];
}

export default function TaskHistory({ tasks }: TaskHistoryProps) {
  if (tasks.length === 0) {
    return (
      <div className="text-center py-12 text-gray-600">
        <p className="text-lg">No completed tasks yet</p>
        <p className="text-sm mt-2">
          Paid bills will appear here for your records
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {tasks.map((task) => (
        <Link
          key={task.id}
          href={`/tasks/${task.id}`}
          className="block bg-white rounded-lg shadow hover:shadow-md transition-shadow p-4"
        >
          <div className="flex items-start gap-4">
            {/* Bill Type Icon */}
            <div className="text-3xl flex-shrink-0">
              {getBillTypeIcon(task.bill.billType)}
            </div>

            {/* Task Details */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{task.bill.vendor}</h3>
                  <p className="text-xl font-bold text-green-600 mt-1">
                    {formatCurrency(task.bill.amount)}
                  </p>

                  <div className="grid grid-cols-2 gap-2 mt-3 text-sm">
                    <div>
                      <p className="text-gray-600">Due Date</p>
                      <p className="font-medium">{formatDate(task.dueDate)}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Paid Date</p>
                      <p className="font-medium text-green-600">
                        {task.paidAt ? formatDate(task.paidAt) : "-"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Payment Proof Thumbnail */}
                {task.paymentProofUrl &&
                  !task.paymentProofUrl.endsWith(".pdf") && (
                    <div className="flex-shrink-0">
                      <Image
                        src={task.paymentProofUrl}
                        alt="Payment proof"
                        width={80}
                        height={80}
                        className="rounded border object-cover"
                      />
                    </div>
                  )}

                {/* PDF Indicator */}
                {task.paymentProofUrl &&
                  task.paymentProofUrl.endsWith(".pdf") && (
                    <div className="flex-shrink-0 w-20 h-20 bg-red-100 rounded border border-red-300 flex items-center justify-center">
                      <span className="text-3xl">📄</span>
                    </div>
                  )}
              </div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
