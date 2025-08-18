
// app/api/messages/request/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { isAdmin } from "@/lib/auth";

export async function POST(req: Request) {
  const { getUser } = getKindeServerSession();
  const viewer = await getUser();
  if (!viewer) return NextResponse.json({ ok: false }, { status: 401 });

  const { toUserId, body } = (await req.json()) as {
    toUserId?: string;
    body?: string;
  };
  if (!toUserId || toUserId === viewer.id) {
    return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });
  }

  const admin = await isAdmin(viewer.id);

  // Admins bypass blocks & requests completely
  if (admin) {
    // 1) Find existing conversation between admin and target
    let convo = await prisma.conversation.findFirst({
      where: {
        participants: { some: { userId: viewer.id } },
        AND: { participants: { some: { userId: toUserId } } },
      },
      select: { id: true, state: true },
    });

    // 2) If none, create ACTIVE convo immediately
    if (!convo) {
      convo = await prisma.conversation.create({
        data: {
          state: "ACTIVE",
          participants: {
            createMany: {
              data: [{ userId: viewer.id }, { userId: toUserId }],
            },
          },
        },
        select: { id: true, state: true },
      });
    } else if (convo.state !== "ACTIVE") {
      // force ACTIVE if previously pending/blocked
      await prisma.conversation.update({
        where: { id: convo.id },
        data: { state: "ACTIVE" },
      });
    }

    // 3) Optional initial message
    const note = (body ?? "").trim();
    if (note) {
      await prisma.message.create({
        data: { conversationId: convo.id, senderId: viewer.id, body: note },
      });
    }

    return NextResponse.json({ ok: true, conversationId: convo.id, status: "ACTIVE" });
  }

  // ===== Normal users (existing behavior) =====

  // block checks (either direction)
  const blocked = await prisma.block.findFirst({
    where: {
      OR: [
        { blockerId: viewer.id, blockedId: toUserId },
        { blockerId: toUserId, blockedId: viewer.id },
      ],
    },
  });
  if (blocked) return NextResponse.json({ ok: false, error: "BLOCKED" }, { status: 403 });

  // Find existing conversation (any state)
  let convo = await prisma.conversation.findFirst({
    where: {
      participants: { some: { userId: viewer.id } },
      AND: { participants: { some: { userId: toUserId } } },
    },
    select: { id: true, state: true },
  });

  // If none, create PENDING
  if (!convo) {
    convo = await prisma.conversation.create({
      data: {
        state: "PENDING",
        participants: {
          createMany: { data: [{ userId: viewer.id }, { userId: toUserId }] },
        },
      },
      select: { id: true, state: true },
    });
  }

  // Upsert the request (one per pair)
  await prisma.messageRequest.upsert({
    where: { from_to_unique: { fromUserId: viewer.id, toUserId } },
    update: { status: "PENDING", conversationId: convo.id },
    create: { fromUserId: viewer.id, toUserId, conversationId: convo.id, status: "PENDING" },
  });

  // Store the first note as the first message (your chosen behavior)
  const note = (body ?? "").trim();
  if (note) {
    await prisma.message.create({
      data: { conversationId: convo.id, senderId: viewer.id, body: note },
    });
  }

  return NextResponse.json({
    ok: true,
    conversationId: convo.id,
    status: convo.state, // PENDING for non-admin until accepted
  });
}
