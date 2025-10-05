function getAvatarFallback(name: string): string {
  if (!name) return "👤";

  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return initials || "👤";
}

interface UserPaymentCardProps {
  userName: string;
  avatarUrl: string | null;
  totalAmount: number;
  billCount: number;
}

export default function UserPaymentCard({
  userName,
  avatarUrl,
  totalAmount,
  billCount,
}: UserPaymentCardProps) {
  const fallback = getAvatarFallback(userName);
  const formattedAmount = `฿${totalAmount.toLocaleString("th-TH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

  return (
    <div className="bg-white rounded-lg shadow border border-gray-200 p-4 mb-6">
      <div className="flex items-center gap-4">
        {/* Avatar */}
        <div className="flex-shrink-0">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={userName}
              className="w-16 h-16 rounded-full object-cover"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xl font-semibold">
              {fallback}
            </div>
          )}
        </div>

        {/* User Info */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 truncate">{userName}</h3>
          <p className="text-sm text-gray-600">Your contribution</p>
        </div>

        {/* Payment Summary */}
        <div className="text-right">
          <p className="font-bold text-lg text-gray-900">{formattedAmount}</p>
          <p className="text-xs text-gray-600">
            {billCount} {billCount === 1 ? "bill" : "bills"}
          </p>
        </div>
      </div>
    </div>
  );
}
