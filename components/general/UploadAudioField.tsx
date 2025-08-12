"use client";

import * as React from "react";
import { UploadButton } from "@uploadthing/react";
import type { OurFileRouter } from "@/app/api/uploadthing/core";
import { Label } from "@/components/ui/label";

export default function UploadAudioField({
  enforce = true,
}: {
  enforce?: boolean;
}) {
  const [url, setUrl] = React.useState("");
  const [isUploading, setUploading] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const [error, setError] = React.useState<string | null>(null);
  const [done, setDone] = React.useState(false);
  const rootRef = React.useRef<HTMLDivElement>(null);

  const setPct = (p: number) =>
    setProgress(
      Math.max(0, Math.min(100, p <= 1 ? Math.round(p * 100) : Math.round(p)))
    );

  // Block submit like UploadImageField
  React.useEffect(() => {
    const form = rootRef.current?.closest("form") as HTMLFormElement | null;
    if (!form) return;

    const onSubmit = (e: Event) => {
      if (isUploading) {
        e.preventDefault();
        setError("Please wait for the upload to finish.");
      } else if (enforce && !url) {
        e.preventDefault();
        setError("Please upload an audio file before submitting.");
      }
    };

    form.addEventListener("submit", onSubmit);
    return () => form.removeEventListener("submit", onSubmit);
  }, [isUploading, url, enforce]);

  // Disable submit buttons like UploadImageField
  React.useEffect(() => {
    const form = rootRef.current?.closest("form") as HTMLFormElement | null;
    if (!form) return;
    const buttons = Array.from(
      form.querySelectorAll<HTMLButtonElement>(
        'button[type="submit"], [role="button"][type="submit"]'
      )
    );
    const shouldDisable = isUploading || (enforce && !url);
    buttons.forEach((b) => (b.disabled = shouldDisable));
    return () => buttons.forEach((b) => (b.disabled = false));
  }, [isUploading, url, enforce]);

  return (
    <div className="flex flex-col gap-2" ref={rootRef}>
      <Label>Audio (optional)</Label>

      <input type="hidden" name="audioUrl" value={url} />

      <div className="relative overflow-hidden rounded-xl border border-dashed border-gray-300 bg-gray-100 p-6 text-center dark:border-gray-700 dark:bg-gray-900/30">
        {/* audio icon */}
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
          <polygon points="5 9 9 9 13 5 13 19 9 15 5 15 5 9" />
          <path d="M15 9.5a3.5 3.5 0 0 1 0 5" />
          <path d="M17.5 7a6 6 0 0 1 0 10" />
        </svg>

        <div className="flex justify-center">
          <UploadButton<OurFileRouter, "postAudio">
            endpoint="postAudio"
            onUploadProgress={(p) => {
              setError(null);
              setDone(false);
              setUploading(true);
              setPct(p as number);
            }}
            onClientUploadComplete={(res: { url?: string }[]) => {
              setUploading(false);
              setPct(100);
              const u = res?.[0]?.url;
              if (u) setUrl(u);
              setDone(true);
              setTimeout(() => setDone(false), 1800);
            }}
            onUploadError={(err) => {
              setUploading(false);
              setPct(0);
              setError(err?.message ?? "Upload failed. Please try again.");
            }}
            appearance={{
              container: "ut-container",
              button:
                "ut-button inline-flex items-center rounded-md border border-gray-300 bg-gray-200 px-3 py-2 text-sm text-zinc-400 font-medium shadow-sm transition hover:bg-gray-50 disabled:opacity-60",
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

        <p className="mt-2 text-xs text-muted-foreground">
          {isUploading
            ? `Uploading… ${progress}%`
            : url
            ? "Audio uploaded ✓"
            : "Upload an MP3/WAV (max 20 MB)."}
        </p>

        {done && (
          <div
            className="pointer-events-none absolute right-3 top-3 rounded-md bg-emerald-500/10 px-2 py-1 text-xs font-medium text-emerald-600 ring-1 ring-inset ring-emerald-500/20"
            role="status"
            aria-live="polite"
          >
            Upload complete
          </div>
        )}

        {error && (
          <div
            className="mt-2 rounded-md bg-red-500/10 px-3 py-2 text-xs text-red-600 ring-1 ring-inset ring-red-500/20"
            role="alert"
          >
            {error}
          </div>
        )}
      </div>

      {url && (
        <div className="mt-3 overflow-hidden rounded-lg border bg-white dark:bg-gray-900">
          <audio
            src={url}
            controls
            className="mx-auto w-full"
            preload="metadata"
          />
        </div>
      )}
    </div>
  );
}
