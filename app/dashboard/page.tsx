import { BlogPostCard } from "@/components/general/BlogPostCard";
import { buttonVariants } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import Link from "next/link";

async function getData(userId: string) {
  const data = await prisma.blogPost.findMany({
    where: { authorId: userId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      content: true,
      imageUrl: true,
      videoUrl: true, // 👈 make sure these are included
      audioUrl: true, // 👈
      authorId: true,
      authorName: true,
      authorImage: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  // Optional: normalize any undefined to null so BlogPostCard's checks are consistent
  return data.map((p) => ({
    ...p,
    imageUrl: p.imageUrl ?? null,
    videoUrl: p.videoUrl ?? null,
    audioUrl: p.audioUrl ?? null,
  }));
}

export default async function DashboardPage() {
  const { getUser } = getKindeServerSession();
  const user = await getUser();

  const data = await getData(user?.id as string);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-medium">your blog articles</h2>
        <Link href={"/dashboard/create"} className={buttonVariants()}>
          create post
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {data.map((item) => (
          <BlogPostCard data={item} key={item.id} />
        ))}
      </div>
    </div>
  );
}
