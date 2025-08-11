
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/auth";

type Ctx = { params: Promise<{ postId: string }> };

// POST /api/posts/:postId/likes
export async function POST(_req: Request, { params }: Ctx) {
  try {
    const userId = await requireUserId();
    const { postId } = await params;

    const post = await prisma.blogPost.findUnique({ where: { id: postId }, select: { id: true } });
    if (!post) return NextResponse.json({ error: "Post not found" }, { status: 404 });

    await prisma.postLike.upsert({
      where: { postId_userId: { postId, userId } },
      create: { postId, userId },
      update: {},
    });

    const count = await prisma.postLike.count({ where: { postId } });
    return NextResponse.json({ liked: true, count });
  } catch (err) {
    if ((err as Error).message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

// DELETE /api/posts/:postId/likes
export async function DELETE(_req: Request, { params }: Ctx) {
  try {
    const userId = await requireUserId();
    const { postId } = await params;

    await prisma.postLike.deleteMany({ where: { postId, userId } });
    const count = await prisma.postLike.count({ where: { postId } });
    return NextResponse.json({ liked: false, count });
  } catch (err) {
    if ((err as Error).message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

// GET /api/posts/:postId/likes
export async function GET(_req: Request, { params }: Ctx) {
  try {
    const { postId } = await params;

    let userId: string | null = null;
    try {
      userId = await requireUserId();
    } catch { /* signed out */ }

    const count = await prisma.postLike.count({ where: { postId } });
    const liked = userId
      ? Boolean(await prisma.postLike.findUnique({ where: { postId_userId: { postId, userId } } }))
      : false;

    return NextResponse.json({ count, liked });
  } catch {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
