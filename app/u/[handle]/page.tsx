// app/u/[handle]/page.tsx
import { prisma } from "@/lib/prisma";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { BlogPostCard } from "@/components/general/BlogPostCard";
import MessageButton from "@/components/messages/MessageButton";
import FollowButton from "@/components/user/FollowButton";
import { buttonVariants } from "@/components/ui/button";

type BlogPostCardData = {
  id: string;
  title: string;
  content: string;
  imageUrl: string | null;
  videoUrl?: string | null;
  audioUrl?: string | null;
  authorId: string;
  authorName: string;
  authorImage: string;
  createdAt: Date;
  updatedAt: Date;
};

async function getUserByHandle(handle: string) {
  return prisma.user.findUnique({
    where: { handle },
    select: { id: true, handle: true, name: true, image: true, bio: true },
  });
}

async function getUserPosts(userId: string): Promise<BlogPostCardData[]> {
  const rows = await prisma.blogPost.findMany({
    where: { authorId: userId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      content: true,
      imageUrl: true,
      videoUrl: true,
      audioUrl: true,
      authorId: true,
      authorName: true,
      authorImage: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  return rows.map((p) => ({
    ...p,
    imageUrl: p.imageUrl ?? null,
    videoUrl: p.videoUrl ?? null,
    audioUrl: p.audioUrl ?? null,
  }));
}

export default async function UserProfilePage(
  ctx: { params: Promise<{ handle: string }> } // ← Next 15: params is a Promise
) {
  const { handle } = await ctx.params; // ← await it

  const { getUser } = getKindeServerSession();
  const viewer = await getUser();

  const user = await getUserByHandle(handle);
  if (!user) return notFound();

  const [posts, followerCount, followingCount] = await Promise.all([
    getUserPosts(user.id),
    prisma.follow.count({ where: { followingId: user.id } }),
    prisma.follow.count({ where: { followerId: user.id } }),
  ]);

  const isSelf = viewer?.id === user.id;
  const loginUrl = `/api/auth/login?postLoginRedirect=${encodeURIComponent(
    `/u/${user.handle}`
  )}`;

  // compute initial follow state
  let initialIsFollowing = false;
  if (viewer && !isSelf) {
    const follow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: { followerId: viewer.id, followingId: user.id },
      },
      select: { id: true },
    });
    initialIsFollowing = !!follow;
  }

  // avatar fallback: prefer user.image, else latest post's authorImage, else default
  let avatar = user.image || null;
  if (!avatar) {
    const lastPost = await prisma.blogPost.findFirst({
      where: { authorId: user.id },
      orderBy: { createdAt: "desc" },
      select: { authorImage: true },
    });
    avatar = lastPost?.authorImage ?? "/default-avatar.png";
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8 p-4">
      <header className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Image
            src={avatar}
            alt={user.name || `@${user.handle}`}
            width={72}
            height={72}
            className="rounded-full"
          />
          <div className="space-y-1">
            <h1 className="text-3xl font-semibold">
              {user.name || `@${user.handle}`}
            </h1>
            <div className="text-md text-muted-foreground">@{user.handle}</div>
            {user.bio && <p className="max-w-prose text-sm">{user.bio}</p>}
            <div className="mt-1 flex gap-4 text-sm text-muted-foreground">
              <Link
                href={`/u/${user.handle}/followers`}
                className="hover:underline"
              >
                <strong>{followerCount}</strong> followers
              </Link>
              <Link
                href={`/u/${user.handle}/following`}
                className="hover:underline"
              >
                <strong>{followingCount}</strong> following
              </Link>
            </div>
          </div>
        </div>

        {/* Actions: follow + message */}
        {!isSelf ? (
          <div className="flex gap-2">
            <FollowButton
              targetUserId={user.id}
              initialIsFollowing={initialIsFollowing}
              isAuthenticated={!!viewer}
              revalidate={[`/u/${user.handle}`]}
            />
            <MessageButton
              toUserId={user.id}
              isAuthenticated={!!viewer}
              loginUrl={loginUrl}
            />
          </div>
        ) : (
          <Link href="/dashboard/create" className={buttonVariants()}>
            create post
          </Link>
        )}
      </header>

      <section>
        <h2 className="mb-3 text-2xl font-medium">posts</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {posts.map((p) => (
            <BlogPostCard key={p.id} data={p} />
          ))}
          {posts.length === 0 && (
            <p className="text-sm text-muted-foreground">
              {isSelf ? "You haven’t published anything yet." : "No posts yet."}
            </p>
          )}
        </div>
      </section>
    </div>
  );
}

// (Optional) If you use generateMetadata, mirror the Promise params:
// export async function generateMetadata(
//   ctx: { params: Promise<{ handle: string }> }
// ) {
//   const { handle } = await ctx.params;
//   return { title: `@${handle}` };
// }
