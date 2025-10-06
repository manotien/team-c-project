import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import MarkPaidButton from "@/components/tasks/MarkPaidButton";
import { formatCurrency, formatDate } from "@/lib/utils";
import { getBillTypeIcon } from "@/lib/billTypes";
import Image from "next/image";
import ImageModal from "@/components/ui/ImageModal";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export default async function TaskDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  const task = await prisma.task.findUnique({
    where: {
      id,
      userId: session.user.id,
    },
    include: {
      bill: true,
    },
  });

  if (!task) {
    notFound();
  }

  const statusColor =
    task.status === "PAID"
      ? "bg-green-100 text-green-700"
      : "bg-yellow-100 text-yellow-700";

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto px-4 py-6 max-w-md">
        {/* Back Button */}
        <Link
          href="/dashboard"
          className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4"
        >
          <svg
            className="w-5 h-5 mr-1"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back to Dashboard
        </Link>

        {/* Header Section */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
          <div className="flex items-start gap-3 mb-4">
            <span className="text-4xl">{getBillTypeIcon(task.bill.billType)}</span>
            <div className="flex-1">
              <h1 className="text-2xl font-bold mb-2">{task.bill.vendor}</h1>
              <span
                className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${statusColor}`}
              >
                {task.status}
              </span>
            </div>
          </div>

          {/* Amount - Prominent Display */}
          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-1">Amount</p>
            <p className="text-3xl font-bold text-blue-600">
              {formatCurrency(Number(task.bill.amount))}
            </p>
          </div>

          {/* Bill Details Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600 mb-1">Bill Type</p>
              <p className="text-base font-semibold capitalize">
                {task.bill.billType.toLowerCase()}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-600 mb-1">Due Date</p>
              <p className="text-base font-semibold">
                {formatDate(task.dueDate)}
              </p>
            </div>

            {task.paidAt && (
              <div>
                <p className="text-sm text-gray-600 mb-1">Paid Date</p>
                <p className="text-base font-semibold text-green-600">
                  {formatDate(task.paidAt)}
                </p>
              </div>
            )}

            <div>
              <p className="text-sm text-gray-600 mb-1">Created Date</p>
              <p className="text-base font-semibold">
                {formatDate(task.createdAt)}
              </p>
            </div>
          </div>
        </div>

        {/* Original Receipt Image */}
        {task.bill.rawImageUrl && (
          <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
            <h2 className="font-semibold text-base mb-3">Original Receipt</h2>
            <ImageModal src={task.bill.rawImageUrl} alt="Original receipt">
              <Image
                src={task.bill.rawImageUrl}
                alt="Original receipt"
                width={600}
                height={400}
                className="rounded-lg border cursor-pointer hover:opacity-90 transition-opacity w-full"
              />
            </ImageModal>
            <p className="text-xs text-gray-500 mt-2">Click image to enlarge</p>
          </div>
        )}

        {/* Payment Proof */}
        {task.paymentProofUrl && (
          <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
            <h2 className="font-semibold text-base mb-3">Payment Proof</h2>
            {task.paymentProofUrl.endsWith(".pdf") ? (
              <a
                href={task.paymentProofUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-red-50 border border-red-200 rounded-lg text-red-700 hover:bg-red-100 transition-colors"
              >
                <span className="text-2xl">📄</span>
                <span>View PDF Payment Proof</span>
              </a>
            ) : (
              <>
                <ImageModal src={task.paymentProofUrl} alt="Payment proof">
                  <Image
                    src={task.paymentProofUrl}
                    alt="Payment proof"
                    width={600}
                    height={400}
                    className="rounded-lg border cursor-pointer hover:opacity-90 transition-opacity w-full"
                  />
                </ImageModal>
                <p className="text-xs text-gray-500 mt-2">
                  Click image to enlarge
                </p>
              </>
            )}
          </div>
        )}

        {/* Action Buttons */}
        {task.status === "UNPAID" && (
          <div className="mt-4">
            <MarkPaidButton
              task={{
                id: task.id,
                status: task.status,
                bill: {
                  vendor: task.bill.vendor,
                  amount: Number(task.bill.amount),
                },
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
