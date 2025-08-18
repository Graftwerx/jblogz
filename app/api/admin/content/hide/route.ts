import { assertAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { NextResponse } from "next/server";

// app/api/admin/content/hide/route.ts
export async function POST(req: Request) {
  const { getUser } = getKindeServerSession(); const u = await getUser();
  if (!u) return NextResponse.json({ ok:false }, { status:401 });
  assertAdmin();

  const { targetType, targetId, reason } = await req.json();
  if (!targetType || !targetId) return NextResponse.json({ ok:false }, { status:400 });

  const now = new Date();
  if (targetType === "POST") {
    await prisma.blogPost.update({ where: { id: targetId }, data: { hiddenAt: now, hiddenById: u.id } });
  } else if (targetType === "COMMENT") {
    await prisma.comment.update({ where: { id: targetId }, data: { hiddenAt: now, hiddenById: u.id } });
  } else if (targetType === "MESSAGE") {
    await prisma.message.update({ where: { id: targetId }, data: { hiddenAt: now, hiddenById: u.id } });
  }

  await prisma.moderationAction.create({
    data: { moderatorId: u.id, targetType, targetId, action: "HIDE_CONTENT", reason },
  });

  return NextResponse.json({ ok:true });
}


