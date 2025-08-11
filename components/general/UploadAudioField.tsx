"use client";

import * as React from "react";
import { UploadButton } from "@uploadthing/react";
import type { OurFileRouter } from "@/app/api/uploadthing/core";
import { Label } from "@/components/ui/label";

export default function UploadAudioField() {
  const [url, setUrl] = React.useState("");

  return (
    <div className="flex flex-col gap-2">
      <Label>Audio (optional)</Label>
      <input type="hidden" name="audioUrl" value={url} />
      <UploadButton<OurFileRouter, "postAudio">
        endpoint="postAudio"
        onClientUploadComplete={(res: { url?: string }[]) => {
          const u = res?.[0]?.url;
          if (u) setUrl(u);
        }}
        onUploadError={(err) => alert(err?.message ?? "Upload failed")}
      />
      {url && (
        <audio src={url} controls className="mt-2 w-full" preload="metadata" />
      )}
    </div>
  );
}
