import { BillCapture } from '@/components/bill-capture/bill-capture';
import { prisma } from '@/lib/prisma';
import TaskList from '@/components/TaskList';

export default async function DashboardPage() {
  // TODO: Replace with actual user session from NextAuth (Epic 9)
  // For now, fetch the first user or create a demo user for development
  const user = await prisma.user.findFirst();

  // If no user exists, we'll show empty state
  const userId = user?.id;

  // Fetch tasks with bills, filtered by user and sorted by due date
  const tasks = userId
    ? await prisma.task.findMany({
        where: { userId },
        include: { bill: true },
        orderBy: { dueDate: 'asc' },
      })
    : [];

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
        <h1 className="text-2xl font-bold mb-6">My Dashboard</h1>
        <TaskList tasks={tasks} />
      </main>
    </div>
  );
}
