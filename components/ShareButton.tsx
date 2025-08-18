"use client";
import { useIsClient } from "@/app/hooks/useIsClient";
import React from "react";
import { Button } from "./ui/button";

export type ShareData = {
  title?: string;
  text?: string;
  url?: string;
};

export function ShareButton({
  data,
  variant = "icon",
  className = "",
  onFallbackCopy,
}: {
  data: ShareData;
  variant?: "icon" | "button";
  className?: string;
  onFallbackCopy?: (copied: boolean) => void;
}) {
  const isClient = useIsClient();
  const [pending, setPending] = React.useState(false);
  const [copied, setCopied] = React.useState(false);

  async function share() {
    if (!isClient) return; // avoid hydration mismatch
    try {
      setPending(true);
      if (navigator.share) {
        await navigator.share(data);
      } else {
        // Fallback: copy URL/text to clipboard
        const toCopy = data.url || data.text || "";
        if (toCopy) {
          await navigator.clipboard.writeText(toCopy);
          setCopied(true);
          onFallbackCopy?.(true);
          setTimeout(() => setCopied(false), 1500);
        }
      }
    } catch {
      // user canceled or error — no-op
    } finally {
      setPending(false);
    }
  }

  const label = copied ? "Copied" : pending ? "Sharing…" : "Share";

  const base = (
    <Button
      type="button"
      onClick={share}
      aria-label={label}
      className={`inline-flex items-center gap-2 rounded-2xl border border-gray-200 px-3 py-2 text-sm shadow-sm hover:bg-green-400 disabled:opacity-60 ${className}`}
      disabled={pending}
    >
      {/* Minimal inline icon to avoid extra deps */}
      <svg
        aria-hidden="true"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="18" cy="5" r="3" />
        <circle cx="6" cy="12" r="3" />
        <circle cx="18" cy="19" r="3" />
        <path d="M8.59 13.51l6.83 3.98M15.41 6.51L8.59 10.49" />
      </svg>
      {variant === "button" && <span>{label}</span>}
      {variant === "icon" && <span className="sr-only">{label}</span>}
    </Button>
  );

  // Render same markup SSR and CSR; actions gated by `isClient`
  return base;
}
