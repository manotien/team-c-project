import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const notification = await prisma.notification.update({
    where: {
      id,
      userId: session.user.id, // Ensure user owns notification
    },
    data: {
      status: "READ",
      readAt: new Date(),
    },
  });

  return NextResponse.json(notification);
}
