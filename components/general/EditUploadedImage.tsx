// components/general/UploadImageField.tsx
"use client";

import * as React from "react";
import { UploadButton } from "@uploadthing/react";
import type { OurFileRouter } from "@/app/api/uploadthing/core";
import { Label } from "@/components/ui/label";

type Props = {
  initialUrl?: string; // current image when editing
  name?: string; // form field name (defaults to "imageUrl")
};

export default function UploadImageField({
  initialUrl = "",
  name = "imageUrl",
}: Props) {
  const [url, setUrl] = React.useState<string>(initialUrl); // holds existing or newly uploaded URL
  const [isUploading, setUploading] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const [error, setError] = React.useState<string | null>(null);
  const [done, setDone] = React.useState(false);
  const [dirty, setDirty] = React.useState(false); // becomes true after a new upload
  const rootRef = React.useRef<HTMLDivElement>(null);

  // normalize 0–1 vs 0–100 → %
  const pct = (p: number) =>
    Math.max(0, Math.min(100, p <= 1 ? Math.round(p * 100) : Math.round(p)));

  // Prevent form submit until upload finishes AND we have some URL (existing or new)
  React.useEffect(() => {
    const form = rootRef.current?.closest("form") as HTMLFormElement | null;
    if (!form) return;

    const onSubmit = (e: Event) => {
      if (isUploading) {
        e.preventDefault();
        setError("Please wait for the upload to finish.");
      } else if (!url) {
        e.preventDefault();
        setError("Please upload an image before submitting.");
      }
    };
    form.addEventListener("submit", onSubmit);
    return () => form.removeEventListener("submit", onSubmit);
  }, [isUploading, url]);

  // Also visually disable submit buttons
  React.useEffect(() => {
    const form = rootRef.current?.closest("form") as HTMLFormElement | null;
    if (!form) return;
    const buttons = Array.from(
      form.querySelectorAll<HTMLButtonElement>(
        'button[type="submit"], [role="button"][type="submit"]'
      )
    );
    buttons.forEach((b) => (b.disabled = isUploading || !url));
    return () => buttons.forEach((b) => (b.disabled = false));
  }, [isUploading, url]);

  return (
    <div className="flex flex-col gap-2" ref={rootRef}>
      <Label>Image</Label>

      {/* Hidden input keeps your action/updatePost unchanged */}
      <input type="hidden" name={name} value={url} />

      <div className="relative overflow-hidden rounded-xl border border-dashed border-gray-300 bg-gray-100 p-6 text-center dark:border-gray-700 dark:bg-gray-900/30">
        {/* centered icon */}
        <svg
          aria-hidden="true"
          className="mx-auto mb-3 h-10 w-10 text-gray-400"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          <circle cx="8.5" cy="8.5" r="1.75" />
          <path d="M21 15l-4.5-4.5L9 18" />
        </svg>

        <div className="flex justify-center">
          <UploadButton<OurFileRouter, "postImage">
            endpoint="postImage"
            uploadProgressGranularity="fine"
            onUploadProgress={(p) => {
              setError(null);
              setDone(false);
              setUploading(true);
              setProgress(pct(p as number));
            }}
            onClientUploadComplete={(res) => {
              setUploading(false);
              setProgress(100);
              const u = res?.[0]?.url ?? res?.[0]?.serverData?.url;
              if (u) {
                setUrl(u);
                setDirty(true);
              }
              setDone(true);
              setTimeout(() => setDone(false), 1800);
            }}
            onUploadError={(err) => {
              setUploading(false);
              setProgress(0);
              setError(err?.message ?? "Upload failed. Please try again.");
            }}
            appearance={{
              container: "ut-container",
              button:
                "ut-button inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-zinc-400 font-medium shadow-sm transition hover:bg-gray-50 disabled:opacity-60",
              allowedContent: "sr-only",
            }}
          />
        </div>

        {/* progress bar */}
        <div
          className="mt-4 h-2 w-full rounded-full bg-gray-200 dark:bg-gray-800"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progress}
        >
          <div
            className="h-full rounded-full bg-blue-500 transition-[width] duration-200"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* status line */}
        <p className="mt-2 text-xs text-muted-foreground">
          {isUploading
            ? `Uploading… ${progress}%`
            : dirty
            ? "Image uploaded ✓"
            : url
            ? "Using existing image"
            : "Upload a JPG/PNG (max 4 MB)."}
        </p>

        {/* completion badge */}
        {done && (
          <div
            className="pointer-events-none absolute right-3 top-3 rounded-md bg-emerald-500/10 px-2 py-1 text-xs font-medium text-emerald-600 ring-1 ring-inset ring-emerald-500/20"
            role="status"
            aria-live="polite"
          >
            Upload complete
          </div>
        )}

        {/* error */}
        {error && (
          <div
            className="mt-2 rounded-md bg-red-500/10 px-3 py-2 text-xs text-red-600 ring-1 ring-inset ring-red-500/20"
            role="alert"
          >
            {error}
          </div>
        )}
      </div>

      {/* preview */}
      {url && (
        <div className="mt-3 overflow-hidden rounded-lg border bg-white dark:bg-gray-900">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={url}
            alt="Uploaded preview"
            className="mx-auto max-h-40 w-auto object-contain p-2"
          />
        </div>
      )}
    </div>
  );
}
