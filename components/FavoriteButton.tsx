// FavoriteButton.tsx
"use client";
import { useIsClient } from "@/app/hooks/useIsClient";
import React from "react";
import { Button } from "./ui/button";

type Props = {
  postId?: string;
  messageId?: string;
  publicId?: string;
  initialIsFavorited?: boolean;
  count?: number;
  isAuthenticated?: boolean;
  loginUrl?: string; // ← changed
  onChange?: (isFavorited: boolean) => void;
  showCount?: boolean;
  className?: string;
};

async function apiFavorite(postId: string, method: "POST" | "DELETE") {
  const res = await fetch("/api/favorites", {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ postId }),
  });
  if (!res.ok) throw new Error("Request failed");
  return (await res.json()) as { ok: boolean; count: number };
}

export function FavoriteButton({
  postId,
  messageId,
  publicId,
  initialIsFavorited = false,
  count = 0,
  isAuthenticated = false,
  loginUrl, // ← changed
  onChange,
  showCount = true,
  className = "",
}: Props) {
  const isClient = useIsClient();
  const targetId = postId ?? messageId ?? publicId;

  const initialRef = React.useRef(initialIsFavorited);
  const [isFav, setIsFav] = React.useState(initialRef.current);
  const [pending, setPending] = React.useState(false);
  const [err, setErr] = React.useState<string | null>(null);
  const [favCount, setFavCount] = React.useState(count);

  async function toggle() {
    if (!isClient || pending) return;

    // Gate unauthenticated users → redirect (client-side)
    if (!isAuthenticated) {
      if (loginUrl) window.location.href = loginUrl;
      return;
    }

    if (!targetId) return;

    setPending(true);
    setErr(null);

    const next = !isFav;
    setIsFav(next);
    setFavCount((c) => (next ? c + 1 : Math.max(0, c - 1)));
    onChange?.(next);

    try {
      const result = await apiFavorite(targetId, next ? "POST" : "DELETE");
      if (!result?.ok) throw new Error("Failed to persist");
      setFavCount(result.count);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Something went wrong";
      setIsFav(!next);
      setFavCount((c) => (!next ? c + 1 : Math.max(0, c - 1)));
      setErr(message);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className={`inline-flex items-center gap-1 ${className}`}>
      <Button
        type="button"
        aria-pressed={isFav}
        aria-label={isFav ? "Remove from favorites" : "Add to favorites"}
        onClick={toggle}
        disabled={pending}
        className={`inline-flex items-center gap-2 rounded-2xl border border-gray-200 px-3 py-2 text-sm shadow-sm disabled:opacity-60 ${
          isFav ? "bg-green-500 border-zinc-200" : "hover:bg-green-400"
        }`}
      >
        {isFav ? (
          <svg
            aria-hidden
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
          </svg>
        ) : (
          <svg
            aria-hidden
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21 12 17.77 5.82 21 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
        )}
        <span className="sr-only">{isFav ? "Favorited" : "Not favorited"}</span>
        <span>{isFav ? "Saved" : "Save"}</span>
      </Button>
      {showCount && (
        <span
          aria-live="polite"
          className="text-xs text-gray-500 min-w-4 text-center"
        >
          {favCount}
        </span>
      )}
      {err && <span className="text-xs text-red-600">{err}</span>}
    </div>
  );
}
