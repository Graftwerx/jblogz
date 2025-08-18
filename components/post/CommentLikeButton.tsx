"use client";

import { useOptimistic, useState, useTransition } from "react";
import { Button } from "../ui/button";

export default function CommentLikeButton({
  commentId,
  initialCount,
  initialLiked,
}: {
  commentId: string;
  initialCount: number;
  initialLiked: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const [server, setServer] = useState({
    count: initialCount,
    liked: initialLiked,
  });

  const [optimistic, doOptimistic] = useOptimistic(
    server,
    (state, next: { like: boolean }) => {
      const delta = next.like ? 1 : -1;
      const nextCount = Math.max(
        0,
        state.count + (state.liked === next.like ? 0 : delta)
      );
      return { count: nextCount, liked: next.like };
    }
  );

  function toggle() {
    const nextLike = !optimistic.liked;

    startTransition(async () => {
      doOptimistic({ like: nextLike });

      try {
        const res = await fetch(`/api/comments/${commentId}/likes`, {
          method: nextLike ? "POST" : "DELETE",
        });

        if (res.status === 401) {
          doOptimistic({ like: !nextLike });
          alert("Please sign in to like comments.");
          return;
        }

        if (!res.ok) {
          doOptimistic({ like: !nextLike });
          console.error("Comment like failed:", await res.text());
          return;
        }

        const data = (await res.json()) as { liked: boolean; count: number };
        setServer({ liked: data.liked, count: data.count });
      } catch (e) {
        doOptimistic({ like: !nextLike });
        console.error(e);
      }
    });
  }

  return (
    <Button
      onClick={toggle}
      disabled={isPending}
      className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs hover:bg-muted disabled:opacity-60"
      aria-pressed={optimistic.liked}
      aria-label={optimistic.liked ? "Unlike comment" : "Like comment"}
    >
      <span>{optimistic.liked ? "❤️" : "🤍"}</span>
      <span>{optimistic.count}</span>
    </Button>
  );
}
