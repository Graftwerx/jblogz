// app/admin/page.tsx
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

import { assertAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import ToastFromQuery from "@/components/system/ToastFromQuery";

export default async function AdminHome() {
  await assertAdmin();

  const [
    usersTotal,
    usersSuspended,
    usersExpelled,
    postsTotal,
    postsHidden,
    commentsTotal,
    commentsHidden,
    reportsOpen,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { status: "SUSPENDED" } }),
    prisma.user.count({ where: { status: "EXPELLED" } }),
    prisma.blogPost.count(),
    prisma.blogPost.count({ where: { hiddenAt: { not: null } } }),
    prisma.comment.count(),
    prisma.comment.count({ where: { hiddenAt: { not: null } } }),
    prisma.report.count({ where: { status: "OPEN" } }),
  ]);

  return (
    <div className="mx-auto max-w-6xl p-4 space-y-6">
      <ToastFromQuery />

      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">admin dashboard</h1>
        <div className="flex gap-2">
          <Link href="/admin/reports">
            <Button variant="outline">reports</Button>
          </Link>
          <Link href="/admin/users">
            <Button variant="outline">users</Button>
          </Link>
          <Link href="/admin/badges">
            <Button>badges</Button>
          </Link>
        </div>
      </header>

      {/* KPI cards */}
      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <CardStat label="users" value={usersTotal} />
        <CardStat label="suspended" value={usersSuspended} />
        <CardStat label="expelled" value={usersExpelled} />
        <CardStat label="open reports" value={reportsOpen} />
        <CardStat label="posts" value={postsTotal} />
        <CardStat label="hidden posts" value={postsHidden} />
        <CardStat label="comments" value={commentsTotal} />
        <CardStat label="hidden comments" value={commentsHidden} />
      </section>
    </div>
  );
}

function CardStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="text-xs uppercase text-muted-foreground">{label}</div>
      <div className="text-2xl font-semibold">{value}</div>
    </div>
  );
}
