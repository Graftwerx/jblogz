    "use server"

import { prisma } from "@/lib/prisma"
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server"
import { redirect } from "next/navigation"

export async function handleSubmission(formData: FormData){
    const {getUser} = getKindeServerSession()
    const user = await getUser()

    if(!user){
        return redirect("api/auth/register")
    }

    const title = formData.get("title")
    const content = formData.get("content")
    const url = formData.get("imageUrl")

    await prisma.blogPost.create({
        data:{
            title: title as string,
            content:content as string,
            imageUrl:url as string,
            authorId: user?.id as string,
            authorImage: user?.picture as string,
            authorName: user?.given_name as string,

        }
    })
    return redirect("/dashboard")
}

export async function updatePost(postId: string, formData: FormData) {
  const { getUser } = getKindeServerSession();
  const user = await getUser();
  if (!user) return redirect("/api/auth/register");

  const post = await prisma.blogPost.findUnique({ where: { id: postId } });
  if (!post) throw new Error("Post not found");
  if (post.authorId !== user.id) throw new Error("Not allowed");

  const title = String(formData.get("title") || "").trim();
  const content = String(formData.get("content") || "").trim();
  const imageUrl = String(formData.get("imageUrl") || "").trim();
  if (!title || !content || !imageUrl) throw new Error("Missing fields");

  await prisma.blogPost.update({
    where: { id: postId },
    data: { title, content, imageUrl },
  });

   return redirect("/dashboard")
}

// DELETE
export async function deletePost(postId: string) {
  const { getUser } = getKindeServerSession();
  const user = await getUser();
  if (!user) return redirect("/api/auth/register");

  const post = await prisma.blogPost.findUnique({ where: { id: postId } });
  if (!post) throw new Error("Post not found");
  if (post.authorId !== user.id) throw new Error("Not allowed");

  await prisma.blogPost.delete({ where: { id: postId } });
  return redirect("/dashboard");
}