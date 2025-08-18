import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { deletePost } from "@/app/actions";
import { DeleteButton } from "@/components/general/DeleteButton";
import Interactions from "@/components/post/Interactions";
import FollowButton from "@/components/user/FollowButton";
import { MessageActions } from "@/components/MessageActions";
import { FlagButton } from "@/components/moderation/FlagButton";

async function getData(id: string) {
  const data = await prisma.blogPost.findUnique({
    where: { id, hiddenAt: null },
  });
  if (!data) return null;
  return data;
}

type Params = Promise<{ id: string }>;

export default async function Page({ params }: { params: Params }) {
  const { id } = await params;
  const data = await getData(id);
  if (!data) return notFound();

  // fetch author's handle from User table
  const dbAuthor = await prisma.user.findUnique({
    where: { id: data.authorId },
    select: { handle: true },
  });
  const authorHandle = dbAuthor?.handle ?? null;

  const { getUser } = getKindeServerSession();
  const user = await getUser();
  const isAuthenticated = !!user;
  const isAuthor = isAuthenticated && user!.id === data.authorId;

  // server-compute initial follow state to avoid UI flicker
  const initialIsFollowing =
    isAuthenticated && !isAuthor
      ? !!(await prisma.follow.findUnique({
          where: {
            followerId_followingId: {
              followerId: user!.id,
              followingId: data.authorId,
            },
          },
          select: { followerId: true },
        }))
      : false;

  // ⭐ server-compute initial favorite state + count (SSR-safe hydration)
  const initialIsFavorited = isAuthenticated
    ? !!(await prisma.favorite.findUnique({
        where: { userId_postId: { userId: user!.id, postId: id } },
        select: { userId: true },
      }))
    : false;

  const favoriteCount = await prisma.favorite.count({
    where: { postId: id },
  });

  async function onDelete() {
    "use server";
    return deletePost(id);
  }

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <div className="flex items-center justify-between">
        <Link href="/" className={buttonVariants({ variant: "secondary" })}>
          back to posts
        </Link>

        {isAuthor && (
          <div className="flex items-center gap-2">
            <Link
              href={`/post/${id}/edit`}
              className={buttonVariants({ variant: "default" })}
            >
              edit
            </Link>
            <form action={onDelete}>
              <DeleteButton />
            </form>
          </div>
        )}
      </div>

      <Card className="mt-6">
        <CardContent className="p-0">
          {/* Header row: left = author, right = actions */}
          <div className="flex items-center justify-between px-6 py-4">
            {/* left: avatar + handle/name + date */}
            <div className="flex items-center gap-3">
              {data.authorImage ? (
                <Image
                  src={data.authorImage}
                  alt={data.authorName}
                  width={40}
                  height={40}
                  className="rounded-full"
                />
              ) : (
                <div className="h-10 w-10 rounded-full bg-muted" />
              )}

              <div className="flex flex-col">
                {authorHandle ? (
                  <Link
                    href={`/u/${authorHandle}`}
                    className="font-medium hover:underline"
                  >
                    @{authorHandle}
                  </Link>
                ) : (
                  <span className="font-medium">{data.authorName}</span>
                )}

                <span className="text-sm text-gray-500">
                  {new Date(data.createdAt).toLocaleDateString("en-GB")}
                </span>
              </div>
            </div>

            {/* right: actions (Follow + Share/Favorite) */}
            <div className="flex items-center gap-2">
              {!isAuthor && (
                <FollowButton
                  targetUserId={data.authorId}
                  initialIsFollowing={initialIsFollowing}
                  isAuthenticated={isAuthenticated}
                  revalidate={[
                    `/post/${id}`,
                    authorHandle ? `/u/${authorHandle}` : "/",
                  ]}
                />
              )}
              <FlagButton targetType="POST" targetId={id} />

              {/* Share + Favorite (client) */}
              <MessageActions
                postId={id}
                permalink={`/post/${id}`}
                text={data.title}
                initialIsFavorited={initialIsFavorited}
                favoriteCount={favoriteCount}
                isAuthenticated={!!user}
                loginUrl={`/api/auth/login?postLoginRedirect=${encodeURIComponent(
                  `/post/${id}`
                )}`} // ← string, safe for RSC
              />
            </div>
          </div>

          {/* Media */}
          {data.imageUrl && (
            <div className="relative h-64 w-full">
              <Image
                src={data.imageUrl}
                alt={data.title}
                fill
                className="object-cover"
              />
            </div>
          )}

          {data.videoUrl && (
            <div className="px-6 pb-4">
              <video
                src={data.videoUrl}
                controls
                playsInline
                preload="metadata"
                className="w-full rounded-lg border"
              />
            </div>
          )}

          {data.audioUrl && (
            <div className="px-6 pb-4">
              <audio
                src={data.audioUrl}
                controls
                preload="metadata"
                className="w-full"
              />
            </div>
          )}

          {/* Body */}
          <div className="px-6 py-4">
            <h1 className="mb-4 text-2xl font-bold">{data.title}</h1>
            <p className="whitespace-pre-line">{data.content}</p>
          </div>
        </CardContent>
      </Card>

      <Interactions postId={id} />
    </div>
  );
}
