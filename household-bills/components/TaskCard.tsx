'use client';

import Link from 'next/link';
import { formatCurrency } from '@/lib/utils';
import { getBillTypeIcon } from '@/lib/billTypes';
import { isDueSoon, isOverdue, getDaysOverdue, formatRelativeDate } from '@/lib/utils/dateHelpers';
import type { Task, Bill } from '@prisma/client';

interface TaskCardProps {
  task: Task & { bill: Bill };
}

export default function TaskCard({ task }: TaskCardProps) {
  const { bill } = task;
  const overdue = isOverdue(task.dueDate);
  const dueSoon = !overdue && isDueSoon(task.dueDate);
  const daysOverdue = getDaysOverdue(task.dueDate);

  return (
    <Link href={`/tasks/${task.id}`}>
      <div className={`border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer ${
        overdue ? 'border-red-500 bg-red-50' : 'bg-white'
      }`}>
        <div className="flex items-start gap-3">
          {/* Bill Type Icon */}
          <div className="text-3xl flex-shrink-0">{getBillTypeIcon(bill.billType)}</div>

          {/* Task Details */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg">{bill.vendor}</h3>
            <p className="text-xl font-bold text-blue-600 mt-1">
              {formatCurrency(bill.amount.toString())}
            </p>
            <p className="text-sm text-gray-700 mt-2">
              {overdue ? (
                <span className="text-red-600 font-medium">
                  {daysOverdue} {daysOverdue === 1 ? 'day' : 'days'} overdue
                </span>
              ) : (
                <>Due {formatRelativeDate(task.dueDate)}</>
              )}
            </p>
          </div>

          {/* Status Badges */}
          <div className="flex flex-col gap-2 items-end">
            {/* Task Status */}
            <span
              className={`px-3 py-1 rounded-full text-xs font-medium ${
                task.status === 'PAID'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-yellow-100 text-yellow-700'
              }`}
            >
              {task.status}
            </span>

            {/* Overdue Badge */}
            {overdue && task.status === 'UNPAID' && (
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-red-600 text-white flex items-center gap-1">
                <span>⚠️</span>
                OVERDUE
              </span>
            )}

            {/* Due Soon Badge */}
            {dueSoon && task.status === 'UNPAID' && (
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
                Due Soon
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
