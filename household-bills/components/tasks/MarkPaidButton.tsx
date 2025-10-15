"use client";

import { useState } from "react";
import MarkPaidDialog from "./MarkPaidDialog";

interface MarkPaidButtonProps {
  task: {
    id: string;
    status: string;
    bill: {
      vendor: string;
      amount: number;
    };
  };
}

export default function MarkPaidButton({ task }: MarkPaidButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (task.status === "PAID") {
    return null;
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
      >
        Mark as Paid
      </button>

      <MarkPaidDialog
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        task={task}
      />
    </>
  );
}
