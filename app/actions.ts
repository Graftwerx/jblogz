"use server";

import { prisma } from "@/lib/prisma";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { redirect } from "next/navigation";

/**
 * Business logic for creating a post.
 * Returns { error } on failure, undefined on success.
 * Use the handleSubmissionAction wrapper for <form action>.
 */
export async function handleSubmission(formData: FormData) {
  const { getUser } = getKindeServerSession();
  const user = await getUser();
  if (!user?.id) return { error: "Unauthorized" };

  const authorId = user.id;
  const authorName = user.given_name
    ? `${user.given_name} ${user.family_name ?? ""}`.trim()
    : user.email ?? "Unknown";
  const authorImage = user.picture ?? "";

  const title = String(formData.get("title") ?? "");
  const content = String(formData.get("content") ?? "");
  const imageUrl = formData.get("imageUrl")?.toString() || null;
  const videoUrl = formData.get("videoUrl")?.toString() || null;
  const audioUrl = formData.get("audioUrl")?.toString() || null;

  if (!title.trim() || !content.trim()) {
    return { error: "Title and content are required." };
  }

  if (!imageUrl && !videoUrl && !audioUrl) {
    return { error: "Please upload an image, video, or audio." };
  }

  await prisma.blogPost.create({
    data: {
      title,
      content,
      imageUrl,
      videoUrl,
      audioUrl,
      authorId,
      authorName,
      authorImage,
    },
  });

  // undefined => success
}

/**
 * Adapter that satisfies <form action> which requires void | Promise<void>.
 * Redirects on success or failure.
 */
export async function handleSubmissionAction(formData: FormData): Promise<void> {
  const res = await handleSubmission(formData);
  if (res?.error) {
    // Redirect back to create with an error message in the URL (render it via searchParams)
    redirect(`/dashboard/create?error=${encodeURIComponent(res.error)}`);
  }
  // Success – choose your destination (home, dashboard, etc.)
  redirect(`/`);
}

/**
 * Update a post (supports optional image/video/audio).
 * Enforces: at least one of image/video/audio must be present after update.
 */
export async function updatePost(postId: string, formData: FormData) {
  const { getUser } = getKindeServerSession();
  const user = await getUser();
  if (!user) return redirect("/api/auth/register");

  const post = await prisma.blogPost.findUnique({ where: { id: postId } });
  if (!post) throw new Error("Post not found");
  if (post.authorId !== user.id) throw new Error("Not allowed");

  const title = String(formData.get("title") ?? "").trim();
  const content = String(formData.get("content") ?? "").trim();

  // Pull raw values (could be empty strings if fields were left blank)
  const rawImage = formData.get("imageUrl")?.toString().trim();
  const rawVideo = formData.get("videoUrl")?.toString().trim();
  const rawAudio = formData.get("audioUrl")?.toString().trim();

  // If a field is "", keep existing DB value. If provided, use it; if truly absent, also keep existing.
  const imageUrl = rawImage === undefined || rawImage === "" ? post.imageUrl : rawImage;
  const videoUrl = rawVideo === undefined || rawVideo === "" ? post.videoUrl : rawVideo;
  const audioUrl = rawAudio === undefined || rawAudio === "" ? post.audioUrl : rawAudio;

  if (!title || !content) throw new Error("Missing fields");

  // Enforce: at least one media after update
  if (!imageUrl && !videoUrl && !audioUrl) {
    throw new Error("Please provide an image, video, or audio.");
  }

  await prisma.blogPost.update({
    where: { id: postId },
    data: { title, content, imageUrl, videoUrl, audioUrl },
  });

  return redirect("/dashboard");
}

/**
 * Delete a post you own.
 */
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
