// components/messages/SendMessageBox.tsx
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "../ui/button";

export default function SendMessageBox({
  conversationId,
}: {
  conversationId: string;
}) {
  const [text, setText] = useState("");
  const [pending, start] = useTransition();
  const router = useRouter();

  async function send() {
    if (!text.trim()) return;
    const res = await fetch(`/api/messages/conversation/${conversationId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: text.trim() }),
    });
    if (res.ok) {
      setText("");
      router.refresh();
    }
  }

  return (
    <div className="flex items-center gap-2">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={2}
        placeholder="Write a message…"
        className="w-full resize-none rounded-md border p-2 text-sm"
      />
      <Button
        onClick={() => start(send)}
        disabled={pending || !text.trim()}
        className="h-10 shrink-0 rounded-md bg-green-600 px-4 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-60"
      >
        send
      </Button>
    </div>
  );
}
