import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";

type Ctx = { params: Promise<{ postId: string }> };

export async function POST(req: Request, { params }: Ctx) {
  try {
    const { getUser } = getKindeServerSession();
    const user = await getUser();
    if (!user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { postId } = await params;
    const { content, parentId }: { content?: string; parentId?: string | null } = await req.json();
    if (!content || !content.trim()) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 });
    }

    const post = await prisma.blogPost.findUnique({ where: { id: postId }, select: { id: true } });
    if (!post) return NextResponse.json({ error: "Post not found" }, { status: 404 });

    if (parentId) {
      const parent = await prisma.comment.findUnique({
        where: { id: parentId },
        select: { id: true, postId: true },
      });
      if (!parent || parent.postId !== postId) {
        return NextResponse.json({ error: "Invalid parent comment" }, { status: 400 });
      }
    }

    const authorName = user.given_name
      ? `${user.given_name} ${user.family_name ?? ""}`.trim()
      : user.email ?? "Unknown";
    const authorImage = user.picture ?? "";

    const comment = await prisma.comment.create({
      data: {
        postId,
        authorId: user.id,
        authorName,
        authorImage,
        content: content.trim(),
        parentId: parentId ?? null,
      },
      include: { _count: { select: { replies: true, likes: true } } },
    });

    return NextResponse.json(comment, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
