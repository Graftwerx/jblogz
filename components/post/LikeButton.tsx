"use client";

import { useOptimistic, useState, useTransition } from "react";
import { Button } from "../ui/button";

type Props = {
  postId: string;
  initialCount: number;
  initialLiked: boolean;
};

export default function LikeButton({
  postId,
  initialCount,
  initialLiked,
}: Props) {
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
      // ✅ optimistic update inside the transition
      doOptimistic({ like: nextLike });

      try {
        const res = await fetch(`/api/posts/${postId}/likes`, {
          method: nextLike ? "POST" : "DELETE",
        });

        if (res.status === 401) {
          // revert inside transition
          doOptimistic({ like: !nextLike });
          alert("Please sign in to like posts.");
          return;
        }

        if (!res.ok) {
          // revert on other errors
          doOptimistic({ like: !nextLike });
          console.error("Like failed:", await res.text());
          return;
        }

        const data = (await res.json()) as { liked: boolean; count: number };
        setServer({ liked: data.liked, count: data.count });
      } catch (e) {
        // network error → revert
        doOptimistic({ like: !nextLike });
        console.error(e);
      }
    });
  }

  return (
    <Button
      onClick={toggle}
      disabled={isPending}
      className="inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm transition hover:bg-muted disabled:opacity-60"
      aria-pressed={optimistic.liked}
      aria-label={optimistic.liked ? "Unlike post" : "Like post"}
    >
      <span>{optimistic.liked ? "❤️" : "🤍"}</span>
      <span>{optimistic.count}</span>
    </Button>
  );
}
