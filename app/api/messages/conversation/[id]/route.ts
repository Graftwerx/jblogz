// app/api/messages/conversation/[id]/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> }   // 👈 params is a Promise
) {
  const { id } = await ctx.params;           // 👈 await it

  const { getUser } = getKindeServerSession();
  const user = await getUser();
  if (!user) return NextResponse.json({ ok:false }, { status:401 });

  const { body } = await req.json();
  const text = (body ?? "").trim();
  if (!text) return NextResponse.json({ ok:false }, { status:400 });

  const convo = await prisma.conversation.findUnique({
    where: { id },
    select: { state: true, participants: { select: { userId: true } } },
  });
  if (!convo) return NextResponse.json({ ok:false }, { status:404 });

  const isMember = convo.participants.some(p => p.userId === user.id);
  if (!isMember) return NextResponse.json({ ok:false }, { status:403 });

  if (convo.state !== "ACTIVE") {
    return NextResponse.json({ ok:false, error:"NOT_ACTIVE" }, { status:403 });
  }

  const msg = await prisma.message.create({
    data: { conversationId: id, senderId: user.id, body: text },
  });

  await prisma.conversation.update({
    where: { id },
    data: { updatedAt: new Date() },
  });

  return NextResponse.json({ ok:true, messageId: msg.id });
}

