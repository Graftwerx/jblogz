// components/messages/MessageButton.tsx
"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";

export default function MessageButton({
  toUserId,
  isAuthenticated,
  loginUrl,
  className = "",
}: {
  toUserId: string;
  isAuthenticated: boolean;
  loginUrl?: string;
  className?: string;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();

  function go() {
    if (!isAuthenticated && loginUrl) {
      window.location.href = loginUrl;
      return;
    }
    router.push(`/messages/compose?to=${encodeURIComponent(toUserId)}`);
  }

  return (
    <button
      onClick={() => start(go)}
      disabled={pending}
      className={`rounded-md border px-3 py-1.5 text-sm hover:bg-muted/40 disabled:opacity-60 ${className}`}
    >
      message
    </button>
  );
}
