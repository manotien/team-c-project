import { BillCapture } from "@/components/bill-capture/bill-capture";

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-white border-b border-gray-200">
        <div className="mx-auto max-w-md px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-indigo-600"></div>
            <h1 className="font-semibold text-sm">Household Tasks & Bills</h1>
          </div>
          <div className="flex items-center gap-2">
            <BillCapture />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-md px-4 py-6">
        <div className="text-center text-gray-500">
          <p className="text-sm">Dashboard content will be implemented in future stories</p>
        </div>
      </main>
    </div>
  );
}
