"use client";

import * as React from "react";
import { UploadButton } from "@uploadthing/react";
import type { OurFileRouter } from "@/app/api/uploadthing/core";
import { Label } from "@/components/ui/label";

export default function UploadVideoField() {
  const [url, setUrl] = React.useState("");

  return (
    <div className="flex flex-col gap-2">
      <Label>Video (optional)</Label>
      <input type="hidden" name="videoUrl" value={url} />
      <UploadButton<OurFileRouter, "postVideo">
        endpoint="postVideo"
        onClientUploadComplete={(res: { url?: string }[]) => {
          const u = res?.[0]?.url;
          if (u) setUrl(u);
        }}
        onUploadError={(err) => alert(err?.message ?? "Upload failed")}
      />
      {url && (
        <video
          src={url}
          controls
          className="mt-2 w-full rounded-lg border"
          preload="metadata"
        />
      )}
    </div>
  );
}
