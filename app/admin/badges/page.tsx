// app/admin/badges/page.tsx
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

import { prisma } from "@/lib/prisma";
import { assertAdmin } from "@/lib/auth";
import { Prisma, BadgeScope } from "@prisma/client";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import ToastFromQuery from "@/components/system/ToastFromQuery";
import { revalidatePath } from "next/cache";

function backWithBanner(
  returnTo: string,
  msg: string,
  type: "success" | "error" | "info" | "warning" = "success"
) {
  const u = new URL(returnTo, "http://local");
  u.searchParams.set("banner", msg);
  u.searchParams.set("bannerType", type);
  return `${u.pathname}?${u.searchParams.toString()}`;
}

const ALL = "ALL" as const;

/* ======================
   SERVER ACTIONS
   ====================== */

async function createBadge(formData: FormData) {
  "use server";
  await assertAdmin();

  const name = String(formData.get("name") || "").trim();
  const slug = String(formData.get("slug") || "")
    .trim()
    .toLowerCase();
  const description =
    String(formData.get("description") || "").trim() || undefined;
  const icon = String(formData.get("icon") || "").trim() || undefined;
  const scope =
    (String(formData.get("scope") || "USER") as BadgeScope) || "USER";
  const returnTo = String(formData.get("returnTo") || "/admin/badges");

  if (!name || !slug) {
    redirect(backWithBanner(returnTo, "Name and slug are required", "error"));
  }

  await prisma.badge.upsert({
    where: { slug },
    update: { name, description, icon, scope },
    create: { name, slug, description, icon, scope },
  });

  revalidatePath(returnTo);
  redirect(backWithBanner(returnTo, "Badge saved"));
}

async function deleteBadge(formData: FormData) {
  "use server";
  await assertAdmin();

  const badgeId = String(formData.get("badgeId") || "");
  const returnTo = String(formData.get("returnTo") || "/admin/badges");
  if (!badgeId) redirect(backWithBanner(returnTo, "Missing badge", "error"));

  await prisma.userBadge.deleteMany({ where: { badgeId } });
  await prisma.badge.delete({ where: { id: badgeId } });

  revalidatePath(returnTo);
  redirect(backWithBanner(returnTo, "Badge deleted"));
}

async function awardBadge(formData: FormData) {
  "use server";
  const adminId = await assertAdmin();

  const badgeId = String(formData.get("badgeId") || "");
  const userQuery = String(formData.get("user") || "").trim();
  const reason = String(formData.get("reason") || "").trim() || undefined;
  const returnTo = String(formData.get("returnTo") || "/admin/badges");

  if (!badgeId || !userQuery) {
    redirect(backWithBanner(returnTo, "User and badge required", "error"));
  }

  // Try to find user by exact id, then handle, then email
  let user = await prisma.user.findUnique({ where: { id: userQuery } });
  if (!user) {
    user = await prisma.user.findUnique({ where: { handle: userQuery } });
  }
  if (!user && userQuery.includes("@")) {
    user = await prisma.user.findUnique({ where: { email: userQuery } });
  }
  if (!user) {
    // fallback contains search (pick first)
    user = await prisma.user.findFirst({
      where: {
        OR: [
          {
            handle: { contains: userQuery, mode: Prisma.QueryMode.insensitive },
          },
          {
            email: { contains: userQuery, mode: Prisma.QueryMode.insensitive },
          },
          { name: { contains: userQuery, mode: Prisma.QueryMode.insensitive } },
        ],
      },
      orderBy: { createdAt: "asc" },
    });
  }
  if (!user) {
    redirect(backWithBanner(returnTo, "User not found", "error"));
  }

  await prisma.userBadge.create({
    data: {
      userId: user.id,
      badgeId,
      reason,
      awardedBy: adminId,
    },
  });

  revalidatePath(returnTo);
  redirect(
    backWithBanner(
      returnTo,
      `Awarded badge to ${
        user.handle ? "@" + user.handle : user.name || "user"
      }`
    )
  );
}

async function revokeAward(formData: FormData) {
  "use server";
  await assertAdmin();

  const userBadgeId = String(formData.get("userBadgeId") || "");
  const returnTo = String(formData.get("returnTo") || "/admin/badges");
  if (!userBadgeId)
    redirect(backWithBanner(returnTo, "Missing award", "error"));

  await prisma.userBadge.delete({ where: { id: userBadgeId } });

  revalidatePath(returnTo);
  redirect(backWithBanner(returnTo, "Award revoked"));
}

/* ======================
   PAGE
   ====================== */

export default async function AdminBadgesPage(ctx: {
  searchParams: Promise<{
    // badges list
    b_page?: string;
    b_pageSize?: string;
    b_q?: string;
    b_scope?: BadgeScope | typeof ALL;

    // awards list
    a_page?: string;
    a_pageSize?: string;
    a_q?: string;

    banner?: string;
    bannerType?: string;
  }>;
}) {
  await assertAdmin();

  const sp = await ctx.searchParams;

  // Badges filters
  const bPage = Math.max(1, Number.parseInt(sp.b_page || "1"));
  const bPageSizeRaw = Number.parseInt(sp.b_pageSize || "20");
  const bPageSize = Math.min(Math.max(bPageSizeRaw || 20, 5), 100);
  const b_q = (sp.b_q || "").trim();
  const b_scope = (sp.b_scope || ALL) as BadgeScope | typeof ALL;

  const badgeWhere: Prisma.BadgeWhereInput = {
    ...(b_scope !== ALL ? { scope: b_scope } : {}),
    ...(b_q
      ? {
          OR: [
            { name: { contains: b_q, mode: Prisma.QueryMode.insensitive } },
            { slug: { contains: b_q, mode: Prisma.QueryMode.insensitive } },
            {
              description: {
                contains: b_q,
                mode: Prisma.QueryMode.insensitive,
              },
            },
          ],
        }
      : {}),
  };

  // Awards filters (recent awards stream)
  const aPage = Math.max(1, Number.parseInt(sp.a_page || "1"));
  const aPageSizeRaw = Number.parseInt(sp.a_pageSize || "20");
  const aPageSize = Math.min(Math.max(aPageSizeRaw || 20, 5), 100);
  const a_q = (sp.a_q || "").trim();

  const awardWhere: Prisma.UserBadgeWhereInput = a_q
    ? {
        OR: [
          {
            user: {
              handle: { contains: a_q, mode: Prisma.QueryMode.insensitive },
            },
          },
          {
            user: {
              email: { contains: a_q, mode: Prisma.QueryMode.insensitive },
            },
          },
          {
            user: {
              name: { contains: a_q, mode: Prisma.QueryMode.insensitive },
            },
          },
          {
            badge: {
              name: { contains: a_q, mode: Prisma.QueryMode.insensitive },
            },
          },
          { reason: { contains: a_q, mode: Prisma.QueryMode.insensitive } },
        ],
      }
    : {};

  const [badgeTotal, badges, awardTotal, awards] = await Promise.all([
    prisma.badge.count({ where: badgeWhere }),
    prisma.badge.findMany({
      where: badgeWhere,
      orderBy: [{ createdAt: "desc" }],
      skip: (bPage - 1) * bPageSize,
      take: bPageSize,
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        icon: true,
        scope: true,
        createdAt: true,
        _count: { select: { awards: true } },
      },
    }),
    prisma.userBadge.count({ where: awardWhere }),
    prisma.userBadge.findMany({
      where: awardWhere,
      orderBy: [{ createdAt: "desc" }],
      skip: (aPage - 1) * aPageSize,
      take: aPageSize,
      select: {
        id: true,
        reason: true,
        createdAt: true,
        user: { select: { id: true, handle: true, name: true } },
        badge: { select: { id: true, name: true, slug: true, scope: true } },
        awardedBy: true,
      },
    }),
  ]);

  const bTotalPages = Math.max(1, Math.ceil(badgeTotal / bPageSize));
  const aTotalPages = Math.max(1, Math.ceil(awardTotal / aPageSize));

  const qs = (next: Partial<Record<string, string>>) => {
    const p = new URLSearchParams({
      b_page: String(next.b_page ?? bPage),
      b_pageSize: String(next.b_pageSize ?? bPageSize),
      b_q: String(next.b_q ?? b_q),
      b_scope: String(next.b_scope ?? b_scope),

      a_page: String(next.a_page ?? aPage),
      a_pageSize: String(next.a_pageSize ?? aPageSize),
      a_q: String(next.a_q ?? a_q),
    });
    return `/admin/badges?${p.toString()}`;
  };
  const returnTo = qs({});

  return (
    <div className="mx-auto max-w-7xl p-4 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">badges</h1>
        <ToastFromQuery />
        <Link href="/admin">
          <Button variant="outline">admin home</Button>
        </Link>
      </div>

      {/* Create / Edit badge */}
      <section className="rounded-lg border p-4">
        <h2 className="mb-3 text-lg font-medium">create / update badge</h2>
        <form
          action={createBadge}
          className="grid grid-cols-1 gap-3 md:grid-cols-6"
        >
          <div className="md:col-span-2">
            <label className="mb-1 block text-xs text-muted-foreground">
              name
            </label>
            <input
              name="name"
              placeholder="Most Liked Post"
              className="w-full rounded border px-2 py-1 text-sm"
              required
            />
          </div>
          <div className="md:col-span-2">
            <label className="mb-1 block text-xs text-muted-foreground">
              slug
            </label>
            <input
              name="slug"
              placeholder="most-liked-post"
              className="w-full rounded border px-2 py-1 text-sm"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">
              scope
            </label>
            <select
              name="scope"
              defaultValue="USER"
              className="w-full rounded border px-2 py-1 text-sm"
            >
              <option value="USER">USER</option>
              <option value="GLOBAL">GLOBAL</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">
              icon (optional)
            </label>
            <input
              name="icon"
              placeholder="trophy"
              className="w-full rounded border px-2 py-1 text-sm"
            />
          </div>
          <div className="md:col-span-6">
            <label className="mb-1 block text-xs text-muted-foreground">
              description (optional)
            </label>
            <input
              name="description"
              placeholder="Awarded to the post with the most likes this month"
              className="w-full rounded border px-2 py-1 text-sm"
            />
          </div>

          <input type="hidden" name="returnTo" value={returnTo} />
          <div className="md:col-span-6">
            <Button type="submit">save badge</Button>
          </div>
        </form>
      </section>

      {/* Badges list */}
      <section className="space-y-3">
        <div className="flex flex-wrap items-end gap-3">
          <h2 className="text-lg font-medium">all badges</h2>
          <form method="get" className="ml-auto flex items-end gap-2">
            <input
              name="b_q"
              defaultValue={b_q}
              placeholder="search name / slug / desc…"
              className="rounded border px-2 py-1 text-sm"
            />
            <select
              name="b_scope"
              defaultValue={b_scope}
              className="rounded border px-2 py-1 text-sm"
            >
              <option value={ALL}>All scopes</option>
              <option value="USER">USER</option>
              <option value="GLOBAL">GLOBAL</option>
            </select>
            <input type="hidden" name="b_page" value="1" />
            <input type="hidden" name="b_pageSize" value={bPageSize} />
            {/* carry awards filters forward */}
            <input type="hidden" name="a_page" value={aPage} />
            <input type="hidden" name="a_pageSize" value={aPageSize} />
            <input type="hidden" name="a_q" value={a_q} />
            <Button type="submit" className="h-8 px-3 text-xs">
              Apply
            </Button>
            <Link href="/admin/badges">
              <Button
                type="button"
                variant="outline"
                className="h-8 px-3 text-xs"
              >
                Clear
              </Button>
            </Link>
          </form>
        </div>

        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/40">
              <tr>
                <th className="px-3 py-2">Badge</th>
                <th className="px-3 py-2">Scope</th>
                <th className="px-3 py-2">Awards</th>
                <th className="px-3 py-2">Created</th>
                <th className="px-3 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {badges.map((b) => (
                <tr key={b.id} className="border-t align-top">
                  <td className="px-3 py-3">
                    <div className="font-medium">{b.name}</div>
                    <div className="text-xs text-muted-foreground">
                      slug: <code>{b.slug}</code>
                      {b.icon ? ` • icon: ${b.icon}` : ""}
                    </div>
                    {b.description && (
                      <div className="mt-1 text-xs text-muted-foreground">
                        {b.description}
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-3">{b.scope}</td>
                  <td className="px-3 py-3">{b._count.awards}</td>
                  <td className="px-3 py-3 whitespace-nowrap">
                    {new Intl.DateTimeFormat("en-GB", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    }).format(b.createdAt)}
                    {/* ^ (b.createdAt is not selected above—omit or add to select if needed) */}
                  </td>
                  <td className="px-3 py-3">
                    <form
                      action={deleteBadge}
                      onSubmit={(e) => {
                        if (
                          !confirm(
                            "Delete this badge? All awards will be removed."
                          )
                        ) {
                          e.preventDefault();
                        }
                      }}
                    >
                      <input type="hidden" name="badgeId" value={b.id} />
                      <input type="hidden" name="returnTo" value={returnTo} />
                      <Button
                        variant="destructive"
                        size="sm"
                        className="h-7 px-2"
                      >
                        delete
                      </Button>
                    </form>
                  </td>
                </tr>
              ))}
              {badges.length === 0 && (
                <tr>
                  <td
                    className="px-3 py-6 text-sm text-muted-foreground"
                    colSpan={5}
                  >
                    No badges found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Badges pagination */}
        {bTotalPages > 1 && (
          <div className="flex items-center justify-end gap-2">
            <Link href={qs({ b_page: String(Math.max(1, bPage - 1)) })}>
              <Button variant="outline" size="sm" disabled={bPage <= 1}>
                Prev
              </Button>
            </Link>
            <span className="text-sm">
              Page {bPage} / {bTotalPages}
            </span>
            <Link
              href={qs({ b_page: String(Math.min(bTotalPages, bPage + 1)) })}
            >
              <Button
                variant="outline"
                size="sm"
                disabled={bPage >= bTotalPages}
              >
                Next
              </Button>
            </Link>
          </div>
        )}
      </section>

      {/* Award a badge */}
      <section className="rounded-lg border p-4">
        <h2 className="mb-3 text-lg font-medium">award a badge</h2>
        <form
          action={awardBadge}
          className="grid grid-cols-1 gap-3 md:grid-cols-5"
        >
          <div className="md:col-span-2">
            <label className="mb-1 block text-xs text-muted-foreground">
              user (id / @handle / email)
            </label>
            <input
              name="user"
              placeholder="@jbizzle"
              className="w-full rounded border px-2 py-1 text-sm"
              required
            />
          </div>
          <div className="md:col-span-2">
            <label className="mb-1 block text-xs text-muted-foreground">
              badge
            </label>
            <select
              name="badgeId"
              className="w-full rounded border px-2 py-1 text-sm"
              required
            >
              <option value="" disabled>
                Select badge…
              </option>
              {badges.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.slug})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">
              reason (optional)
            </label>
            <input
              name="reason"
              placeholder="Most liked post - Aug 2025"
              className="w-full rounded border px-2 py-1 text-sm"
            />
          </div>
          <input type="hidden" name="returnTo" value={returnTo} />
          <div className="md:col-span-5">
            <Button type="submit">award</Button>
          </div>
        </form>
      </section>

      {/* Recent awards */}
      <section className="space-y-3">
        <div className="flex flex-wrap items-end gap-3">
          <h2 className="text-lg font-medium">recent awards</h2>
          <form method="get" className="ml-auto flex items-end gap-2">
            <input
              name="a_q"
              defaultValue={a_q}
              placeholder="search user/badge/reason…"
              className="rounded border px-2 py-1 text-sm"
            />
            {/* carry badges filters forward */}
            <input type="hidden" name="b_page" value={bPage} />
            <input type="hidden" name="b_pageSize" value={bPageSize} />
            <input type="hidden" name="b_q" value={b_q} />
            <input type="hidden" name="b_scope" value={b_scope} />
            {/* reset awards page on new query */}
            <input type="hidden" name="a_page" value="1" />
            <input type="hidden" name="a_pageSize" value={aPageSize} />
            <Button type="submit" className="h-8 px-3 text-xs">
              Apply
            </Button>
            <Link href="/admin/badges">
              <Button
                type="button"
                variant="outline"
                className="h-8 px-3 text-xs"
              >
                Clear
              </Button>
            </Link>
          </form>
        </div>

        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/40">
              <tr>
                <th className="px-3 py-2">User</th>
                <th className="px-3 py-2">Badge</th>
                <th className="px-3 py-2">Reason</th>
                <th className="px-3 py-2">Awarded</th>
                <th className="px-3 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {awards.map((a) => (
                <tr key={a.id} className="border-t align-top">
                  <td className="px-3 py-3">
                    {a.user.handle ? (
                      <Link
                        href={`/u/${a.user.handle}`}
                        className="hover:underline font-medium"
                      >
                        @{a.user.handle}
                      </Link>
                    ) : (
                      <span className="font-medium">
                        {a.user.name || a.user.id}
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-3">
                    <div className="font-medium">{a.badge.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {a.badge.slug}
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    {a.reason || (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap">
                    {new Intl.DateTimeFormat("en-GB", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    }).format(a.createdAt)}
                  </td>
                  <td className="px-3 py-3">
                    <form
                      action={revokeAward}
                      onSubmit={(e) => {
                        if (!confirm("Revoke this award?")) e.preventDefault();
                      }}
                    >
                      <input type="hidden" name="userBadgeId" value={a.id} />
                      <input type="hidden" name="returnTo" value={returnTo} />
                      <Button variant="outline" size="sm" className="h-7 px-2">
                        revoke
                      </Button>
                    </form>
                  </td>
                </tr>
              ))}
              {awards.length === 0 && (
                <tr>
                  <td
                    className="px-3 py-6 text-sm text-muted-foreground"
                    colSpan={5}
                  >
                    No awards found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Awards pagination */}
        {aTotalPages > 1 && (
          <div className="flex items-center justify-end gap-2">
            <Link href={qs({ a_page: String(Math.max(1, aPage - 1)) })}>
              <Button variant="outline" size="sm" disabled={aPage <= 1}>
                Prev
              </Button>
            </Link>
            <span className="text-sm">
              Page {aPage} / {aTotalPages}
            </span>
            <Link
              href={qs({ a_page: String(Math.min(aTotalPages, aPage + 1)) })}
            >
              <Button
                variant="outline"
                size="sm"
                disabled={aPage >= aTotalPages}
              >
                Next
              </Button>
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}
