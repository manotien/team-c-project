import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const skip = (page - 1) * limit;

  const [notifications, total, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where: { userId: user.id },
      include: {
        task: {
          include: {
            bill: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: limit > 0 ? skip : undefined,
      take: limit > 0 ? limit : undefined,
    }),
    prisma.notification.count({
      where: { userId: user.id },
    }),
    prisma.notification.count({
      where: {
        userId: user.id,
        readAt: null,
      },
    }),
  ]);

  return NextResponse.json({
    notifications,
    pagination: {
      total,
      page,
      limit,
      totalPages: limit > 0 ? Math.ceil(total / limit) : 1,
    },
    unreadCount,
  });
}
