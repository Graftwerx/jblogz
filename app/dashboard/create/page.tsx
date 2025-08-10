import { handleSubmission } from "@/app/actions";
import { SubmitButton } from "@/components/general/SubmitButton";

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

export default function CreateBlogPage() {
  return (
    <Card className="max-w-lg mx-auto">
      <CardHeader>
        <CardTitle>create post</CardTitle>
        <CardDescription>share a new post with the world</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={handleSubmission} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label>Title</Label>
            <Input name="title" required type="text" placeholder="title" />
          </div>
          <div className="flex flex-col gap-2">
            <Label>Content</Label>
            <Textarea name="content" required placeholder="content" />
          </div>
          <div className="flex flex-col gap-2">
            <Label>Image</Label>
            <Input
              name="imageUrl"
              required
              type="url"
              placeholder="image url"
            />
          </div>
          <SubmitButton />
        </form>
      </CardContent>
    </Card>
  );
}
