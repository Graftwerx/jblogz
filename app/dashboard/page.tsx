// app/dashboard/page.tsx
import { buttonVariants } from "@/components/ui/button";

import { prisma } from "@/lib/prisma";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import UpdatedToast from "@/components/system/UpdatedToast";
import { DashboardTabs } from "@/components/dashboard/DashboardTabs";
import type { ReactElement } from "react";

// Local type matching BlogPostCard's expected data
type BlogPostCardData = {
  id: string;
  title: string;
  content: string;
  imageUrl: string | null;
  videoUrl: string | null;
  audioUrl: string | null;
  authorId: string;
  authorName: string;
  authorImage: string;
  createdAt: Date;
  updatedAt: Date;
};

// ——— Queries ———
async function getMyPosts(userId: string): Promise<BlogPostCardData[]> {
  const data = await prisma.blogPost.findMany({
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

  return data.map((p) => ({
    ...p,
    imageUrl: p.imageUrl ?? null,
    videoUrl: p.videoUrl ?? null,
    audioUrl: p.audioUrl ?? null,
  }));
}

async function getFavoritesFeed(userId: string): Promise<BlogPostCardData[]> {
  const favs = await prisma.favorite.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: {
      createdAt: true,
      post: {
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
      },
    },
  });

  return favs.map((f) => ({
    ...f.post,
    imageUrl: f.post.imageUrl ?? null,
    videoUrl: f.post.videoUrl ?? null,
    audioUrl: f.post.audioUrl ?? null,
  }));
}

async function getFollowingFeed(userId: string): Promise<BlogPostCardData[]> {
  const following = await prisma.follow.findMany({
    where: { followerId: userId },
    select: { followingId: true },
  });
  const ids = following.map((f) => f.followingId);
  if (ids.length === 0) return [];

  const posts = await prisma.blogPost.findMany({
    where: { authorId: { in: ids } },
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

  return posts.map((p) => ({
    ...p,
    imageUrl: p.imageUrl ?? null,
    videoUrl: p.videoUrl ?? null,
    audioUrl: p.audioUrl ?? null,
  }));
}

// Activity structure (favorites on my posts, new followers, my favorites)
async function getActivity(userId: string) {
  const [favOnMyPosts, newFollowers, myFavs] = await Promise.all([
    prisma.favorite.findMany({
      where: { post: { authorId: userId } },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        createdAt: true,
        user: { select: { id: true, name: true, image: true, handle: true } },
        post: { select: { id: true, title: true } },
      },
    }),
    prisma.follow.findMany({
      where: { followingId: userId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        createdAt: true,
        follower: {
          select: { id: true, name: true, image: true, handle: true },
        },
      },
    }),
    prisma.favorite.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        createdAt: true,
        post: { select: { id: true, title: true } },
      },
    }),
  ]);

  return {
    notifications: favOnMyPosts,
    newFollowers,
    myActions: myFavs,
  };
}

// Messages (requests + conversations)
async function getPendingRequests(userId: string) {
  return prisma.messageRequest.findMany({
    where: { toUserId: userId, status: "PENDING" },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      createdAt: true,
      fromUser: { select: { id: true, handle: true, name: true, image: true } },
    },
  });
}

async function getConversations(userId: string) {
  return prisma.conversation.findMany({
    where: { state: "ACTIVE", participants: { some: { userId } } },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      updatedAt: true,
      participants: {
        select: {
          user: { select: { id: true, handle: true, name: true, image: true } },
        },
      },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { id: true, body: true, createdAt: true, senderId: true },
      },
    },
  });
}

// ——— Page ———
export default async function DashboardPage(): Promise<ReactElement> {
  const { getUser } = getKindeServerSession();
  const authUser = await getUser();
  if (!authUser) redirect("/");

  const [
    dbUser,
    posts,
    followersCount,
    followingCount,
    favoritesFeed,
    followingFeed,
    activity,
    requests,
    conversations,
  ] = await Promise.all([
    prisma.user.findUnique({
      where: { id: authUser.id },
      select: { handle: true, image: true, name: true },
    }),
    getMyPosts(authUser.id),
    prisma.follow.count({ where: { followingId: authUser.id } }),
    prisma.follow.count({ where: { followerId: authUser.id } }),
    getFavoritesFeed(authUser.id),
    getFollowingFeed(authUser.id),
    getActivity(authUser.id),
    getPendingRequests(authUser.id),
    getConversations(authUser.id),
  ]);

  // avatar fallback to latest post's authorImage, then default
  let avatar = dbUser?.image ?? null;
  if (!avatar) {
    const lastPost = await prisma.blogPost.findFirst({
      where: { authorId: authUser.id },
      orderBy: { createdAt: "desc" },
      select: { authorImage: true },
    });
    avatar = lastPost?.authorImage ?? "/default-avatar.png";
  }

  const handle = dbUser?.handle ?? null;
  const pendingCount = requests.length;

  return (
    <div className="space-y-8">
      <UpdatedToast />

      {/* Profile header */}
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Image
            src={avatar}
            alt={handle ?? authUser.given_name ?? "me"}
            width={56}
            height={56}
            className="rounded-full"
          />
          <div className="leading-tight">
            <div className="text-lg font-semibold">
              {handle ? `@${handle}` : authUser.given_name}
            </div>
            {dbUser?.name && (
              <div className="text-sm text-muted-foreground">{dbUser.name}</div>
            )}
          </div>
        </div>

        <Link href="/dashboard/create" className={buttonVariants()}>
          create post
        </Link>
      </header>

      {/* Stats row */}
      <section className="grid w-full max-w-md grid-cols-3 gap-3">
        {handle ? (
          <Link
            href={`/u/${handle}/followers`}
            className="rounded-lg p-3 hover:bg-muted/40"
          >
            <div className="text-xs text-muted-foreground">followers</div>
            <div className="text-xl font-semibold">{followersCount}</div>
          </Link>
        ) : (
          <div className="rounded-lg p-3">
            <div className="text-xs text-muted-foreground">followers</div>
            <div className="text-xl font-semibold">{followersCount}</div>
          </div>
        )}

        {handle ? (
          <Link
            href={`/u/${handle}/following`}
            className="rounded-lg p-3 hover:bg-muted/40"
          >
            <div className="text-xs text-muted-foreground">following</div>
            <div className="text-xl font-semibold">{followingCount}</div>
          </Link>
        ) : (
          <div className="rounded-lg p-3">
            <div className="text-xs text-muted-foreground">following</div>
            <div className="text-xl font-semibold">{followingCount}</div>
          </div>
        )}

        <div className="rounded-lg p-3">
          <div className="text-xs text-muted-foreground">posts</div>
          <div className="text-xl font-semibold">{posts.length}</div>
        </div>
      </section>

      {/* Tabs */}
      <DashboardTabs
        currentUserId={authUser.id}
        myPosts={posts}
        favoritesFeed={favoritesFeed}
        followingFeed={followingFeed}
        activity={activity}
        messages={{
          pendingCount,
          requests,
          conversations,
        }}
      />
    </div>
  );
}
