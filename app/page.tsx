import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { BlogPostCard } from "@/components/general/BlogPostCard";
import { Skeleton } from "@/components/ui/skeleton";
import SearchBar from "@/components/general/SearchBar";

// ---- Data ----
// ---- Data ----
async function getData(q?: string) {
  const query = (q ?? "").trim();
  const terms = query.split(/\s+/).filter(Boolean);

  return prisma.blogPost.findMany({
    where: query
      ? {
          OR: [
            { title: { contains: query, mode: "insensitive" } },
            { authorName: { contains: query, mode: "insensitive" } },
            {
              AND: terms.map((t) => ({
                content: { contains: t, mode: "insensitive" },
              })),
            },
          ],
        }
      : undefined,
    select: {
      id: true,
      title: true,
      content: true,
      imageUrl: true,
      videoUrl: true, // 👈 add this
      audioUrl: true, // 👈 and this
      authorImage: true,
      authorName: true,
      createdAt: true,
      updatedAt: true,
      authorId: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

// ---- Page ----
export default async function Page({
  searchParams,
}: {
  searchParams?: Promise<{ q?: string }>;
}) {
  const { q = "" } = (await searchParams) ?? {};

  return (
    <div className="py-6">
      <div className="mb-6 space-y-3">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          {" "}
          <h1 className="text-3xl font-bold tracking-tight">Latest Posts</h1>
          <div className="max-w-xl">
            <SearchBar initialValue={q} />
          </div>
        </div>

        {q ? (
          <p className="text-sm text-muted-foreground">
            Showing results for <span className="font-medium">“{q}”</span>
          </p>
        ) : null}
      </div>

      <Suspense fallback={<GridSkeleton />}>
        {/* Server component fetch that re-renders on ?q= changes */}
        <BlogPosts q={q} />
      </Suspense>
    </div>
  );
}

// ---- Async server bit rendered inside Suspense ----
async function BlogPosts({ q }: { q?: string }) {
  const data = await getData(q);

  if (!data.length) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-20 text-center">
        <p className="text-lg font-semibold">No results</p>
        <p className="text-sm text-muted-foreground">
          Try a different title, author name, or keywords.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {data.map((item) => (
        <BlogPostCard key={item.id} data={item} />
      ))}
    </div>
  );
}

// ---- Skeleton for first paint & during transitions ----
function GridSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <article key={i} className="space-y-3">
          <Skeleton className="h-40 w-full rounded-xl" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </article>
      ))}
    </div>
  );
}
