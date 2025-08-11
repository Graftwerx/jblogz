export async function likePost(postId: string) {
  const res = await fetch(`/api/posts/${postId}/likes`, { method: "POST" });
  if (!res.ok) throw new Error("Failed to like post");
  return res.json() as Promise<{ liked: true; count: number }>;
}

export async function unlikePost(postId: string) {
  const res = await fetch(`/api/posts/${postId}/likes`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to unlike post");
  return res.json() as Promise<{ liked: false; count: number }>;
}

export async function likeComment(commentId: string) {
  const res = await fetch(`/api/comments/${commentId}/likes`, { method: "POST" });
  if (!res.ok) throw new Error("Failed to like comment");
  return res.json() as Promise<{ liked: true; count: number }>;
}

export async function unlikeComment(commentId: string) {
  const res = await fetch(`/api/comments/${commentId}/likes`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to unlike comment");
  return res.json() as Promise<{ liked: false; count: number }>;
}

export async function createComment(postId: string, content: string, parentId?: string) {
  const res = await fetch(`/api/posts/${postId}/comments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content, parentId: parentId ?? null }),
  });
  if (!res.ok) throw new Error("Failed to create comment");
  return res.json();
}
