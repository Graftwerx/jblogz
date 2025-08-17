
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";

export async function POST(
  _req: Request,
  ctx: { params: Promise<{ id: string }> } // 👈 params is a Promise
) {
  const { id } = await ctx.params;          // 👈 await it

  const { getUser } = getKindeServerSession();
  const user = await getUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  // Load the request and ensure it's addressed to the viewer
  const reqItem = await prisma.messageRequest.findUnique({
    where: { id },
    select: {
      id: true,
      status: true,
      fromUserId: true,
      toUserId: true,
      conversationId: true,
    },
  });
  if (!reqItem || reqItem.toUserId !== user.id) {
    return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });
  }

  // Find or create the conversation
  let convoId = reqItem.conversationId;
  if (!convoId) {
    const convo = await prisma.conversation.create({
      data: {
        state: "PENDING",
        participants: {
          createMany: {
            data: [
              { userId: reqItem.fromUserId },
              { userId: reqItem.toUserId },
            ],
          },
        },
      },
      select: { id: true },
    });
    convoId = convo.id;
  }

  // Flip conversation to ACTIVE and mark request ACCEPTED atomically
  await prisma.$transaction([
    prisma.conversation.update({
      where: { id: convoId! },
      data: { state: "ACTIVE" },
    }),
    prisma.messageRequest.update({
      where: { id: reqItem.id },
      data: { status: "ACCEPTED", conversationId: convoId! },
    }),
  ]);

  return NextResponse.json({ ok: true, conversationId: convoId });
}

