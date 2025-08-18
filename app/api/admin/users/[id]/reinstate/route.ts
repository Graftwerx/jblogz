// app/api/admin/users/[id]/reinstate/route.ts
import { assertAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { NextResponse } from "next/server";

export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const { getUser } = getKindeServerSession(); const u = await getUser();
  if (!u) return NextResponse.json({ ok:false }, { status:401 });
  assertAdmin();

  await prisma.user.update({ where: { id }, data: { status: "ACTIVE", suspendedUntil: null, expelledAt: null } });
  await prisma.moderationAction.create({
    data: { moderatorId: u.id, targetType: "USER", targetId: id, action: "REINSTATE_USER" },
  });
  return NextResponse.json({ ok:true });
}
