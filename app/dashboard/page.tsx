// app/dashboard/page.tsx
import { BlogPostCard } from "@/components/general/BlogPostCard";
import { buttonVariants } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import UpdatedToast from "@/components/system/UpdatedToast";

async function getPosts(userId: string) {
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

  // normalize optional media fields for the card component
  return data.map((p) => ({
    ...p,
    imageUrl: p.imageUrl ?? null,
    videoUrl: p.videoUrl ?? null,
    audioUrl: p.audioUrl ?? null,
  }));
}

export default async function DashboardPage() {
  const { getUser } = getKindeServerSession();
  const authUser = await getUser();
  if (!authUser) redirect("/");

  // fetch everything in parallel
  const [dbUser, posts, followersCount, followingCount] = await Promise.all([
    prisma.user.findUnique({
      where: { id: authUser.id },
      select: { handle: true, image: true, name: true },
    }),
    getPosts(authUser.id),
    prisma.follow.count({ where: { followingId: authUser.id } }), // people who follow me
    prisma.follow.count({ where: { followerId: authUser.id } }), // people I follow
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

  return (
    <div className="space-y-8">
      {/* Profile header */}
      <UpdatedToast />
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
        {/* followers */}
        {handle ? (
          <Link
            href={`/u/${handle}/followers`}
            className="rounded-lg  p-3 hover:bg-muted/40"
          >
            <div className="text-xs text-muted-foreground">followers</div>
            <div className="text-xl font-semibold">{followersCount}</div>
          </Link>
        ) : (
          <div className="rounded-lg  p-3">
            <div className="text-xs text-muted-foreground">followers</div>
            <div className="text-xl font-semibold">{followersCount}</div>
          </div>
        )}

        {/* following */}
        {handle ? (
          <Link
            href={`/u/${handle}/following`}
            className="rounded-lg  p-3 hover:bg-muted/40"
          >
            <div className="text-xs text-muted-foreground">following</div>
            <div className="text-xl font-semibold">{followingCount}</div>
          </Link>
        ) : (
          <div className="rounded-lg  p-3">
            <div className="text-xs text-muted-foreground">following</div>
            <div className="text-xl font-semibold">{followingCount}</div>
          </div>
        )}

        {/* posts */}
        <div className="rounded-lg p-3">
          <div className="text-xs text-muted-foreground">posts</div>
          <div className="text-xl font-semibold">{posts.length}</div>
        </div>
      </section>

      {/* Articles header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-medium">your blog articles</h2>
      </div>

      {/* Articles grid */}
      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {posts.map((item) => (
          <BlogPostCard data={item} key={item.id} />
        ))}
        {posts.length === 0 && (
          <p className="text-sm text-muted-foreground">
            You haven’t published anything yet.
          </p>
        )}
      </section>
    </div>
  );
}
