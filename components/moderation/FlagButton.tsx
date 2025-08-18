// components/moderation/FlagButton.tsx
"use client";

import { useEffect, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { Button } from "../ui/button";

type TargetType = "POST" | "COMMENT" | "MESSAGE" | "USER";
type Reason =
  | "SPAM"
  | "HARASSMENT"
  | "HATE"
  | "NUDITY"
  | "VIOLENCE"
  | "SELF_HARM"
  | "COPYRIGHT"
  | "OTHER";

export function FlagButton({
  targetType,
  targetId,
  defaultReason = "SPAM",
  className = "",
}: {
  targetType: TargetType;
  targetId: string;
  defaultReason?: Reason;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<Reason>(defaultReason);
  const [details, setDetails] = useState("");
  const [, setOk] = useState<null | boolean>(null);
  const [err, setErr] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const [mounted, setMounted] = useState(false);

  // Ensure portal only renders on client
  useEffect(() => setMounted(true), []);

  // Prevent background scroll when modal open
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  async function submit() {
    setErr(null);
    setOk(null);

    start(async () => {
      const res = await fetch("/api/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetType, targetId, reason, details }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setErr(j?.error || "Could not submit report.");
        setOk(false);
        return;
      }
      setOk(true);
      setOpen(false);
      setDetails("");
      setReason(defaultReason);
    });
  }

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        className={`rounded-md border px-2 py-1 text-xs hover:bg-muted/40 ${className}`}
      >
        report
      </Button>

      {mounted &&
        open &&
        createPortal(
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
            onClick={() => setOpen(false)} // click backdrop to close
          >
            <div
              className="w-full max-w-md rounded-md bg-white p-4 shadow-lg"
              onClick={(e) => e.stopPropagation()} // don’t close when clicking inside
            >
              <h3 className="mb-2 text-sm font-semibold">Report content</h3>

              <label className="mb-1 block text-xs font-medium">Reason</label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value as Reason)}
                className="mb-2 w-full rounded border px-2 py-1 text-sm"
              >
                <option>SPAM</option>
                <option>HARASSMENT</option>
                <option>HATE</option>
                <option>NUDITY</option>
                <option>VIOLENCE</option>
                <option>SELF_HARM</option>
                <option>COPYRIGHT</option>
                <option>OTHER</option>
              </select>

              <label className="mb-1 block text-xs font-medium">
                Details (optional)
              </label>
              <textarea
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                rows={4}
                className="mb-2 w-full resize-none rounded border px-2 py-1 text-sm"
                placeholder="Add context for moderators…"
                maxLength={2000}
              />

              {err && <p className="mb-2 text-xs text-red-600">{err}</p>}

              <div className="flex justify-end gap-2">
                <Button
                  className="rounded border px-3 py-1 text-sm"
                  onClick={() => setOpen(false)}
                  type="button"
                >
                  cancel
                </Button>
                <Button
                  onClick={submit}
                  disabled={pending}
                  className="rounded bg-red-600 px-3 py-1 text-sm text-white hover:bg-red-700 disabled:opacity-60"
                >
                  submit
                </Button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
