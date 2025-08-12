"use client";
import { handleSubmissionAction } from "@/app/actions";
import { SubmitButton } from "@/components/general/SubmitButton";
import UploadImageField from "@/components/general/UploadImageField";
import UploadVideoField from "@/components/general/UploadVideoField";
import UploadAudioField from "@/components/general/UploadAudioField";
import MediaAtLeastOneGuard from "@/components/general/MediaAtLeastOneGuard";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import { Video, AudioLines, ImageIcon } from "lucide-react"; // Lucide icons
import { useState } from "react";

export default function CreateBlogPage() {
  const [selectedMedia, setSelectedMedia] = useState<
    "image" | "video" | "audio" | null
  >(null);

  return (
    <Card className="max-w-lg mx-auto">
      <CardHeader>
        <CardTitle>create post</CardTitle>
        <CardDescription>share a new post with the world</CardDescription>
      </CardHeader>
      <CardContent>
        <form
          id="create-post-form"
          action={handleSubmissionAction}
          className="flex flex-col gap-4"
        >
          {/* Title */}
          <div className="flex flex-col gap-2">
            <Label>Title</Label>
            <Input name="title" required type="text" placeholder="title" />
          </div>

          {/* Content */}
          <div className="flex flex-col gap-2">
            <Label>Content</Label>
            <Textarea name="content" required placeholder="content" />
          </div>

          {/* Media selector row */}
          <div>
            <Label>Media</Label>
          </div>
          <div className="flex items-center justify-center gap-6">
            <button
              type="button"
              onClick={() => setSelectedMedia("image")}
              className={`flex flex-col items-center gap-1 p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 ${
                selectedMedia === "image" ? "ring-2 ring-blue-500" : ""
              }`}
            >
              <ImageIcon size={32} />
              <span className="text-xs">Image</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedMedia("video")}
              className={`flex flex-col items-center gap-1 p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 ${
                selectedMedia === "video" ? "ring-2 ring-blue-500" : ""
              }`}
            >
              <Video className="h-8 w-8" />
              <span className="text-xs">Video</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedMedia("audio")}
              className={`flex flex-col items-center gap-1 p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 ${
                selectedMedia === "audio" ? "ring-2 ring-blue-500" : ""
              }`}
            >
              <AudioLines className="h-8 w-8" />
              <span className="text-xs">Audio</span>
            </button>
          </div>

          {/* Conditionally render selected upload field */}
          {selectedMedia === "image" && <UploadImageField enforce={false} />}
          {selectedMedia === "video" && <UploadVideoField enforce={false} />}
          {selectedMedia === "audio" && <UploadAudioField enforce={false} />}

          <MediaAtLeastOneGuard formId="create-post-form" />

          <SubmitButton />
        </form>
      </CardContent>
    </Card>
  );
}
