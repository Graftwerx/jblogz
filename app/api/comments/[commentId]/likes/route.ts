import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";

type Ctx = { params: Promise<{ commentId: string }> };

// POST /api/comments/:commentId/likes
export async function POST(_req: Request, { params }: Ctx) {
  try {
    const userId = await requireUserId();
    const { commentId } = await params;

    const exists = await prisma.comment.findUnique({ where: { id: commentId }, select: { id: true } });
    if (!exists) return NextResponse.json({ error: "Comment not found" }, { status: 404 });

    await prisma.commentLike.upsert({
      where: { commentId_userId: { commentId, userId } },
      create: { commentId, userId },
      update: {},
    });

    const count = await prisma.commentLike.count({ where: { commentId } });
    return NextResponse.json({ liked: true, count });
  } catch (err) {
    if ((err as Error).message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

// DELETE /api/comments/:commentId/likes
export async function DELETE(_req: Request, { params }: Ctx) {
  try {
    const userId = await requireUserId();
    const { commentId } = await params;

    await prisma.commentLike.deleteMany({ where: { commentId, userId } });
    const count = await prisma.commentLike.count({ where: { commentId } });
    return NextResponse.json({ liked: false, count });
  } catch (err) {
    if ((err as Error).message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

// GET /api/comments/:commentId/likes
export async function GET(_req: Request, { params }: Ctx) {
  try {
    const { commentId } = await params;

    let userId: string | null = null;
    try {
      userId = await requireUserId();
    } catch { /* signed out */ }

    const count = await prisma.commentLike.count({ where: { commentId } });
    const liked = userId
      ? Boolean(await prisma.commentLike.findUnique({ where: { commentId_userId: { commentId, userId } } }))
      : false;

    return NextResponse.json({ count, liked });
  } catch {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

