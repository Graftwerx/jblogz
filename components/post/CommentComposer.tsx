"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "../ui/button";

type Props = {
  postId: string;
  parentId?: string;
  placeholder?: string;
  onDone?: () => void;
};

export default function CommentComposer({
  postId,
  parentId,
  placeholder,
  onDone,
}: Props) {
  const [value, setValue] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function submit() {
    const content = value.trim();
    if (!content) return;

    startTransition(async () => {
      try {
        const res = await fetch(`/api/posts/${postId}/comments`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content, parentId: parentId ?? null }),
        });

        if (res.status === 401) {
          alert("Please sign in to comment.");
          return;
        }

        if (!res.ok) {
          const t = await res.text();
          console.error("Create comment failed:", t);
          alert("Failed to post comment. Please try again.");
          return;
        }

        setValue("");
        onDone?.();
        router.refresh();
      } catch (e) {
        console.error(e);
        alert("Network error. Please try again.");
      }
    });
  }

  return (
    <div className="flex items-start gap-2">
      <textarea
        className="min-h-[38px] flex-1 rounded-md border p-2 text-sm"
        placeholder={placeholder ?? "Add a comment…"}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        disabled={isPending}
      />
      <Button
        onClick={submit}
        disabled={isPending || value.trim().length === 0}
        className="rounded-md border px-3 py-2 text-sm font-medium hover:bg-muted disabled:opacity-60"
      >
        Post
      </Button>
    </div>
  );
}
