'use client';

import Link from 'next/link';
import { formatCurrency, formatDate } from '@/lib/utils';
import { getBillTypeIcon } from '@/lib/billTypes';
import type { Task, Bill } from '@prisma/client';

interface TaskCardProps {
  task: Task & { bill: Bill };
}

export default function TaskCard({ task }: TaskCardProps) {
  const { bill } = task;

  return (
    <Link href={`/tasks/${task.id}`}>
      <div className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer bg-white">
        <div className="flex items-start gap-3">
          {/* Bill Type Icon */}
          <div className="text-3xl">{getBillTypeIcon(bill.billType)}</div>

          {/* Task Details */}
          <div className="flex-1">
            <h3 className="font-semibold text-lg">{bill.vendor}</h3>
            <p className="text-xl font-bold text-blue-600 mt-1">
              {formatCurrency(bill.amount.toString())}
            </p>
            <p className="text-sm text-gray-600 mt-2">
              Due: {formatDate(task.dueDate)}
            </p>
          </div>

          {/* Status Badge */}
          <div>
            <span
              className={`px-3 py-1 rounded-full text-xs font-medium ${
                task.status === 'PAID'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-yellow-100 text-yellow-700'
              }`}
            >
              {task.status}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
