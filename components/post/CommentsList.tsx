// components/post/CommentsList.tsx
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import CommentLikeButton from "./CommentLikeButton";
import CommentComposer from "./CommentComposer";

export default async function CommentsList({ postId }: { postId: string }) {
  const { getUser } = getKindeServerSession();
  const user = await getUser();
  const userId = user?.id ?? null;

  // 1) fetch comments + replies with counts (no likes arrays)
  const comments = await prisma.comment.findMany({
    where: { postId, parentId: null },
    orderBy: { createdAt: "asc" },
    include: {
      _count: { select: { likes: true, replies: true } },
      replies: {
        orderBy: { createdAt: "asc" },
        include: {
          _count: { select: { likes: true, replies: true } },
        },
      },
    },
  });

  if (comments.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No comments yet. Be the first!
      </p>
    );
  }

  // 2) if signed in, fetch which comments this user liked (one small query)
  let likedSet = new Set<string>();
  if (userId) {
    const allIds = [
      ...comments.map((c) => c.id),
      ...comments.flatMap((c) => c.replies.map((r) => r.id)),
    ];
    if (allIds.length > 0) {
      const liked = await prisma.commentLike.findMany({
        where: { userId, commentId: { in: allIds } },
        select: { commentId: true },
      });
      likedSet = new Set(liked.map((l) => l.commentId));
    }
  }

  return (
    <div className="space-y-4">
      {comments.map((c) => (
        <div key={c.id} className="rounded-lg border p-3">
          {/* header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {c.authorImage ? (
                <Image
                  src={c.authorImage}
                  alt={c.authorName}
                  width={24}
                  height={24}
                  className="rounded-full"
                />
              ) : (
                <div className="h-6 w-6 rounded-full bg-muted" />
              )}
              <span className="text-sm font-medium">{c.authorName}</span>
            </div>
            <span className="text-xs text-muted-foreground">
              {new Date(c.createdAt).toLocaleString()}
            </span>
          </div>

          {/* body */}
          <p className="mt-2 whitespace-pre-wrap text-sm">{c.content}</p>

          {/* actions */}
          <div className="mt-2 flex items-center gap-3">
            <CommentLikeButton
              commentId={c.id}
              initialCount={c._count.likes}
              initialLiked={likedSet.has(c.id)}
            />
            <details>
              <summary className="cursor-pointer text-xs underline">
                Reply
              </summary>
              <div className="mt-2">
                <CommentComposer postId={postId} parentId={c.id} />
              </div>
            </details>
          </div>

          {/* replies */}
          {c.replies.length > 0 && (
            <div className="mt-3 space-y-3 border-l pl-3">
              {c.replies.map((r) => (
                <div key={r.id}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {r.authorImage ? (
                        <Image
                          src={r.authorImage}
                          alt={r.authorName}
                          width={20}
                          height={20}
                          className="rounded-full"
                        />
                      ) : (
                        <div className="h-5 w-5 rounded-full bg-muted" />
                      )}
                      <span className="text-sm font-medium">
                        {r.authorName}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(r.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="mt-1 whitespace-pre-wrap text-sm">
                    {r.content}
                  </p>
                  <div className="mt-1">
                    <CommentLikeButton
                      commentId={r.id}
                      initialCount={r._count.likes}
                      initialLiked={likedSet.has(r.id)}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
