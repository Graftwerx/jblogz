import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import UserRow from "@/components/user/UserRow";

type Params = Promise<{ handle: string }>;
type SP = Promise<{ cursor?: string }>;

export default async function FollowersPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SP;
}) {
  const { handle } = await params;
  const sp = await searchParams;
  const cursor = sp?.cursor ?? null;

  const profile = await prisma.user.findUnique({
    where: { handle: handle.toLowerCase() },
    select: { id: true, handle: true, name: true },
  });
  if (!profile) return notFound();

  const TAKE = 20;

  const rows = await prisma.follow.findMany({
    where: { followingId: profile.id }, // people who follow ME
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: TAKE + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    include: {
      follower: { select: { handle: true, name: true, image: true } },
    },
  });

  const hasMore = rows.length > TAKE;
  const pageRows = hasMore ? rows.slice(0, TAKE) : rows;
  const nextCursor = hasMore ? pageRows[pageRows.length - 1].id : null;

  const count = await prisma.follow.count({
    where: { followingId: profile.id },
  });

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Followers · @{profile.handle}</h1>
        <Link href={`/u/${profile.handle}`} className="text-sm underline">
          back to profile
        </Link>
      </div>

      <p className="text-sm text-muted-foreground">{count} total</p>

      <div className="space-y-2">
        {pageRows.map((f) =>
          f.follower?.handle ? (
            <UserRow
              key={f.id}
              handle={f.follower.handle}
              name={f.follower.name}
              image={f.follower.image}
            />
          ) : null
        )}
        {pageRows.length === 0 && (
          <p className="text-sm text-muted-foreground">No followers yet.</p>
        )}
      </div>

      <div className="flex justify-end">
        {hasMore && nextCursor ? (
          <Link
            href={`/u/${profile.handle}/followers?cursor=${encodeURIComponent(
              nextCursor
            )}`}
            className="text-sm underline"
          >
            Next →
          </Link>
        ) : null}
      </div>
    </div>
  );
}
