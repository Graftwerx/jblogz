
// app/api/messages/request/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";

export async function POST(req: Request) {
  const { getUser } = getKindeServerSession();
  const user = await getUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  const { toUserId, body }:{ toUserId?: string; body?: string } = await req.json();
  if (!toUserId || toUserId === user.id) {
    return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });
  }

  // Block checks either direction
  const blocked = await prisma.block.findFirst({
    where: {
      OR: [
        { blockerId: user.id, blockedId: toUserId },
        { blockerId: toUserId, blockedId: user.id },
      ],
    },
  });
  if (blocked) return NextResponse.json({ ok: false, error: "BLOCKED" }, { status: 403 });

  // Find an existing conversation between the pair (any state)
  let convo = await prisma.conversation.findFirst({
    where: {
      participants: { some: { userId: user.id } },
      AND: { participants: { some: { userId: toUserId } } },
    },
    select: { id: true, state: true },
  });

  // If none, create a PENDING conversation
  if (!convo) {
    convo = await prisma.conversation.create({
      data: {
        state: "PENDING",
        participants: {
          createMany: {
            data: [{ userId: user.id }, { userId: toUserId }],
          },
        },
      },
      select: { id: true, state: true },
    });
  }

  // Upsert the MessageRequest (compound unique named "from_to_unique")
  const reqRecord = await prisma.messageRequest.upsert({
    where: { from_to_unique: { fromUserId: user.id, toUserId } },
    update: { status: "PENDING", conversationId: convo.id },
    create: { fromUserId: user.id, toUserId, conversationId: convo.id, status: "PENDING" },
    select: { id: true, conversationId: true },
  });

  // If user provided a note, save it as the first message (optional)
  const note = (body || "").trim();
  if (note) {
    await prisma.message.create({
      data: { conversationId: convo.id, senderId: user.id, body: note },
    });
  }

  return NextResponse.json({
    ok: true,
    conversationId: reqRecord.conversationId ?? convo.id,
  });
}
