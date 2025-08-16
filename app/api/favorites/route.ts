import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";

export async function POST(req: Request) {
  const { getUser } = getKindeServerSession();
  const user = await getUser();
  if (!user) return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });

  const { postId } = await req.json();
  if (!postId) return NextResponse.json({ ok: false, error: "MISSING_POST_ID" }, { status: 400 });

  await prisma.favorite.upsert({
    where: { userId_postId: { userId: user.id, postId } },
    update: {},
    create: { userId: user.id, postId },
  });

  const count = await prisma.favorite.count({ where: { postId } });
  return NextResponse.json({ ok: true, count });
}

export async function DELETE(req: Request) {
  const { getUser } = getKindeServerSession();
  const user = await getUser();
  if (!user) return NextResponse.json({ ok: false, error: "UNAUTHORIZED" }, { status: 401 });

  const { postId } = await req.json();
  if (!postId) return NextResponse.json({ ok: false, error: "MISSING_POST_ID" }, { status: 400 });

  await prisma.favorite
    .delete({ where: { userId_postId: { userId: user.id, postId } } })
    .catch(() => {});

  const count = await prisma.favorite.count({ where: { postId } });
  return NextResponse.json({ ok: true, count });
}
