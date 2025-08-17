// components/messages/ComposeRequestForm.tsx
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export default function ComposeRequestForm({ toUserId }: { toUserId: string }) {
  const [text, setText] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const router = useRouter();

  const maxLen = 280;

  async function submit() {
    setErr(null);
    const body = text.trim();
    if (body.length === 0) {
      setErr("Please write a short message.");
      return;
    }
    if (body.length > maxLen) {
      setErr(`Too long (${body.length}/${maxLen}).`);
      return;
    }

    start(async () => {
      const res = await fetch("/api/messages/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toUserId, body }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setErr(j?.error || "Could not send request.");
        return;
      }
      const json = await res.json().catch(() => null);
      const convoId = json?.conversationId;
      if (convoId) {
        router.push(`/messages/${convoId}`);
      } else {
        router.push("/messages");
      }
    });
  }

  return (
    <div className="rounded-lg border p-4">
      <label className="mb-2 block text-sm font-medium">Message request</label>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={4}
        maxLength={maxLen}
        placeholder="Write a short note…"
        className="mb-2 w-full resize-none rounded-md border px-3 py-2 text-sm"
      />
      <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
        <span>First message will be delivered once accepted.</span>
        <span>
          {text.trim().length}/{maxLen}
        </span>
      </div>
      {err && <p className="mb-2 text-sm text-red-600">{err}</p>}
      <div className="flex items-center gap-2">
        <button
          onClick={submit}
          disabled={pending || text.trim().length === 0}
          className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-60"
        >
          send request
        </button>
        <button
          onClick={() => history.back()}
          className="rounded-md border px-4 py-2 text-sm hover:bg-muted/40"
          type="button"
        >
          cancel
        </button>
      </div>
    </div>
  );
}
