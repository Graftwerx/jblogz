import { prisma } from "@/lib/prisma";
import { updatePost } from "@/app/actions";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SubmitButton } from "@/components/general/SubmitButton";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { redirect, notFound } from "next/navigation";
import UploadImageField from "@/components/general/EditUploadedImage";

async function getData(id: string) {
  const post = await prisma.blogPost.findUnique({ where: { id } });
  if (!post) return null;
  return post;
}

type Params = Promise<{ id: string }>;

export default async function EditPostPage({ params }: { params: Params }) {
  const { id } = await params;
  const post = await getData(id);
  if (!post) return notFound();

  const { getUser } = getKindeServerSession();
  const user = await getUser();
  if (!user) return redirect("/api/auth/register");
  if (post.authorId !== user.id) throw new Error("Not allowed");

  async function onSubmit(formData: FormData) {
    "use server";
    return updatePost(id, formData);
  }

  return (
    <Card className="max-w-lg mx-auto">
      <CardHeader>
        <CardTitle>edit post</CardTitle>
        <CardDescription>update your post</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={onSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label>Title</Label>
            <Input
              name="title"
              required
              type="text"
              defaultValue={post.title}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label>Content</Label>
            <Textarea name="content" required defaultValue={post.content} />
          </div>
          <div className="flex flex-col gap-2">
            <UploadImageField initialUrl={post.imageUrl ?? ""} />
          </div>
          <SubmitButton />
        </form>
      </CardContent>
    </Card>
  );
}
