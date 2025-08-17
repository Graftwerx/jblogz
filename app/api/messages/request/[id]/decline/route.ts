import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";

export async function POST(
  _req: Request,
  ctx: { params: Promise<{ id: string }> } // 👈 params is a Promise in Next 15
) {
  const { id } = await ctx.params;          // 👈 await it

  const { getUser } = getKindeServerSession();
  const user = await getUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  const reqItem = await prisma.messageRequest.findUnique({
    where: { id },
    select: { id: true, toUserId: true },
  });

  if (!reqItem || reqItem.toUserId !== user.id) {
    return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });
  }

  await prisma.messageRequest.update({
    where: { id },
    data: { status: "DECLINED" },
  });

  return NextResponse.json({ ok: true });
}
