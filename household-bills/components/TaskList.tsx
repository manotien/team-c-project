"use client";

import TaskCard from "./TaskCard";
import type { Task, Bill } from "@prisma/client";

interface TaskWithBill extends Task {
  bill: Bill;
}

interface TaskListProps {
  tasks: TaskWithBill[];
}

export default function TaskList({ tasks }: TaskListProps) {
  if (tasks.length === 0) {
    return (
      <div className="text-center py-12 text-gray-600">
        <p>No bills to pay yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold mb-4">My Tasks</h2>
      <div className="grid gap-4">
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} />
        ))}
      </div>
    </div>
  );
}
