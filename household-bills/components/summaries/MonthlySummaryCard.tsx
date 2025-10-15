import { format } from "date-fns";

interface MonthlySummaryCardProps {
  totalAmount: number;
  billCount: number;
  month: Date;
}

export default function MonthlySummaryCard({
  totalAmount,
  billCount,
  month,
}: MonthlySummaryCardProps) {
  const monthName = format(month, "MMMM yyyy");
  const formattedAmount = `฿${totalAmount.toLocaleString("th-TH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

  return (
    <div className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-lg shadow-lg p-6 mb-6">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-sm font-medium opacity-90">{monthName}</h2>
        <span className="text-xs bg-white text-gray-800 bg-opacity-20 px-2 py-1 rounded">
          This Month
        </span>
      </div>

      <div className="mt-3">
        <p className="text-3xl font-bold">{formattedAmount}</p>
        <p className="text-sm opacity-90 mt-1">
          {billCount} {billCount === 1 ? "bill" : "bills"} paid
        </p>
      </div>
    </div>
  );
}
