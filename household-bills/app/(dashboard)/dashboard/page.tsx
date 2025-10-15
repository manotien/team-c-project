import { BillCapture } from '@/components/bill-capture/bill-capture';
import { prisma } from '@/lib/prisma';
import TaskList from '@/components/TaskList';
import TaskHistory from '@/components/tasks/TaskHistory';
import NotificationBell from '@/components/notifications/NotificationBell';
import MonthlySummaryCard from '@/components/summaries/MonthlySummaryCard';
import UserPaymentCard from '@/components/summaries/UserPaymentCard';
import { UserMenu } from '@/components/layout/UserMenu';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Image from 'next/image';

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  // Check authentication
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect('/login');
  }

  const { view = 'upcoming' } = await searchParams;

  // Get authenticated user
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      avatarUrl: true,
    },
  });

  if (!user) {
    redirect('/login');
  }

  const userId = user.id;

  // Fetch overdue tasks (UNPAID and past due date)
  const overdueTasksRaw = userId && view === 'upcoming'
    ? await prisma.task.findMany({
        where: {
          userId,
          status: 'UNPAID',
          dueDate: { lt: new Date() }
        },
        include: { bill: true },
        orderBy: { dueDate: 'asc' },
      })
    : [];

  // Transform overdue tasks to convert Decimal to number
  const overdueTasks = overdueTasksRaw.map((task) => ({
    ...task,
    bill: {
      ...task.bill,
      amount: Number(task.bill.amount),
    },
  }));

  // Fetch upcoming tasks (UNPAID and future/today due date)
  const upcomingTasksRaw = userId && view === 'upcoming'
    ? await prisma.task.findMany({
        where: {
          userId,
          status: 'UNPAID',
          dueDate: { gte: new Date() }
        },
        include: { bill: true },
        orderBy: { dueDate: 'asc' },
        take: 10,
      })
    : [];

  // Transform upcoming tasks to convert Decimal to number
  const upcomingTasks = upcomingTasksRaw.map((task) => ({
    ...task,
    bill: {
      ...task.bill,
      amount: Number(task.bill.amount),
    },
  }));

  // Fetch completed tasks (PAID)
  const completedTasks = userId && view === 'completed'
    ? await prisma.task.findMany({
        where: { userId, status: 'PAID' },
        include: { bill: true },
        orderBy: { paidAt: 'desc' },
        take: 50,
      })
    : [];

  // Transform data for TaskHistory component
  const historyTasks = completedTasks.map((task) => ({
    id: task.id,
    status: task.status,
    dueDate: task.dueDate,
    paidAt: task.paidAt,
    paymentProofUrl: task.paymentProofUrl,
    bill: {
      vendor: task.bill.vendor,
      amount: Number(task.bill.amount),
      billType: task.bill.billType,
    },
  }));

  // Calculate monthly summary
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  const monthlyPaidTasks = userId
    ? await prisma.task.findMany({
        where: {
          userId,
          status: 'PAID',
          paidAt: {
            gte: startOfMonth,
            lte: endOfMonth,
          },
        },
        include: { bill: true },
      })
    : [];

  const monthlyTotal = monthlyPaidTasks.reduce(
    (sum, task) => sum + Number(task.bill.amount),
    0
  );
  const monthlyCount = monthlyPaidTasks.length;

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-white border-b border-gray-200">
        <div className="mx-auto max-w-md px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Image src="/logo.png" alt="Billify" width={24} height={24} />
            <h1 className="font-semibold text-sm">Billify</h1>
          </div>
          <div className="flex items-center gap-2">
            <NotificationBell />
            <BillCapture />
            <UserMenu />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-md px-4 py-6">
        <h1 className="text-2xl font-bold mb-6 text-gray-900">My Dashboard</h1>

        {/* Monthly Summary Card */}
        <MonthlySummaryCard
          totalAmount={monthlyTotal}
          billCount={monthlyCount}
          month={now}
        />

        {/* User Payment Card */}
        {user && (
          <UserPaymentCard
            userName={user.name}
            avatarUrl={user.avatarUrl}
            totalAmount={monthlyTotal}
            billCount={monthlyCount}
          />
        )}

        {/* Tabs */}
        <div className="flex gap-2 border-b mb-6">
          <a
            href="/dashboard?view=upcoming"
            className={`px-4 py-2 border-b-2 transition-colors flex items-center gap-2 ${
              view === 'upcoming'
                ? 'border-blue-600 text-blue-600 font-semibold'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <span>Upcoming Tasks</span>
            {overdueTasks.length > 0 && (
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-600 text-white">
                {overdueTasks.length}
              </span>
            )}
          </a>
          <a
            href="/dashboard?view=completed"
            className={`px-4 py-2 border-b-2 transition-colors ${
              view === 'completed'
                ? 'border-blue-600 text-blue-600 font-semibold'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            History
          </a>
        </div>

        {/* Content */}
        {view === 'upcoming' && (
          <div className="space-y-8">
            {/* Overdue Section */}
            {overdueTasks.length > 0 && (
              <div>
                <h2 className="text-xl font-bold text-red-600 mb-4 flex items-center gap-2">
                  <span>⚠️</span>
                  Overdue Tasks ({overdueTasks.length})
                </h2>
                <TaskList tasks={overdueTasks} />
              </div>
            )}

            {/* Upcoming Section */}
            <div>
              <h2 className="text-xl font-bold mb-4">
                {overdueTasks.length > 0 ? 'Other Upcoming Tasks' : 'Upcoming Tasks'}
              </h2>
              <TaskList tasks={upcomingTasks} />
            </div>
          </div>
        )}
        {view === 'completed' && <TaskHistory tasks={historyTasks} />}
      </main>
    </div>
  );
}
