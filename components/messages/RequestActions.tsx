// components/messages/RequestActions.tsx
"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "../ui/button";

export default function RequestActions({ requestId }: { requestId: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();

  async function post(url: string) {
    const res = await fetch(url, { method: "POST" });
    if (!res.ok) return;
    // If accepted, you might want to redirect to the convo:
    if (url.includes("/accept")) {
      const json = await res.json().catch(() => ({}));
      if (json?.conversationId) {
        router.push(`/messages/${json.conversationId}`);
        return;
      }
    }
    router.refresh();
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        onClick={() =>
          start(() => post(`/api/messages/request/${requestId}/accept`))
        }
        disabled={pending}
        className="rounded-md bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-60"
      >
        accept
      </Button>
      <Button
        onClick={() =>
          start(() => post(`/api/messages/request/${requestId}/decline`))
        }
        disabled={pending}
        className="rounded-md border px-3 py-1.5 text-xs font-medium hover:bg-muted/40 disabled:opacity-60"
      >
        decline
      </Button>
    </div>
  );
}
