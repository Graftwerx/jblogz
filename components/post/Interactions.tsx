// components/post/Interactions.tsx
import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";

import LikeButton from "./LikeButton";
import CommentComposer from "./CommentComposer";
import CommentsList from "./CommentsList";

// hydrate initial state for LikeButton + render comments
export default async function Interactions({ postId }: { postId: string }) {
  const { getUser } = getKindeServerSession();
  const user = await getUser();
  const userId = user?.id ?? null;

  const [postLikeCount, youLiked] = await Promise.all([
    prisma.postLike.count({ where: { postId } }),
    userId
      ? prisma.postLike
          .findUnique({ where: { postId_userId: { postId, userId } } })
          .then(Boolean)
      : Promise.resolve(false),
  ]);

  return (
    <div className="mt-6 space-y-4">
      {/* like row + quick comment box */}
      <div className="flex items-center justify-between gap-3">
        <LikeButton
          postId={postId}
          initialCount={postLikeCount}
          initialLiked={youLiked}
        />
        <div className="flex-1">
          <CommentComposer postId={postId} placeholder="Write a comment…" />
        </div>
      </div>

      {/* comments */}
      <Suspense
        fallback={
          <div className="text-sm text-muted-foreground">Loading comments…</div>
        }
      >
        {/* Server-rendered list; includes nested replies one level deep */}
        <CommentsList postId={postId} />
      </Suspense>
    </div>
  );
}
