import { handleSubmissionAction } from "@/app/actions";
import { SubmitButton } from "@/components/general/SubmitButton";
import UploadImageField from "@/components/general/UploadImageField";

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
import UploadVideoField from "@/components/general/UploadVideoField";
import UploadAudioField from "@/components/general/UploadAudioField";
import MediaAtLeastOneGuard from "@/components/general/MediaAtLeastOneGuard";

export default function CreateBlogPage() {
  return (
    <Card className="max-w-lg mx-auto">
      <CardHeader>
        <CardTitle>create post</CardTitle>
        <CardDescription>share a new post with the world</CardDescription>
      </CardHeader>
      <CardContent>
        {/* Note: form needs a ref/id so the guard can find it */}
        <form
          id="create-post-form"
          action={handleSubmissionAction}
          className="flex flex-col gap-4"
        >
          <div className="flex flex-col gap-2">
            <Label>Title</Label>
            <Input name="title" required type="text" placeholder="title" />
          </div>

          <div className="flex flex-col gap-2">
            <Label>Content</Label>
            <Textarea name="content" required placeholder="content" />
          </div>

          {/* Media uploads (each optional) */}
          <div className="flex flex-col gap-4">
            {/* Make sure your UploadImageField does NOT hard-block submit if empty */}
            <UploadImageField enforce={false} />
            <UploadVideoField enforce={false} />
            <UploadAudioField enforce={false} />
          </div>

          {/* Client guard enforces: at least one of imageUrl/videoUrl/audioUrl */}
          <MediaAtLeastOneGuard formId="create-post-form" />

          <SubmitButton />
        </form>
      </CardContent>
    </Card>
  );
}
