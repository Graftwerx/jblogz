// app/admin/users/page.tsx
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

import { prisma } from "@/lib/prisma";
import { assertAdmin } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import ToastFromQuery from "@/components/system/ToastFromQuery";
import RowNotesBinder from "@/components/admin/RowNotesBinder";
import { Prisma, UserRole, UserStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";

/* ------------------ utils ------------------ */
function fmtDate(d: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(d);
}
const ALL = "ALL" as const;

type SortKey = "createdDesc" | "createdAsc" | "followersDesc" | "postsDesc";

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

/* ------------------ server actions ------------------ */
async function startAdminDM(formData: FormData) {
  "use server";
  const adminId = await assertAdmin();
  const toUserId = String(formData.get("toUserId") || "");
  const note = (String(formData.get("note") || "") || "").trim();
  const returnTo = String(formData.get("returnTo") || "/admin/users");

  if (!toUserId) {
    revalidatePath(returnTo);
    redirect(backWithBanner(returnTo, "Missing user", "error"));
  }

  // find/create ACTIVE conversation between admin and target
  let convo = await prisma.conversation.findFirst({
    where: {
      AND: [
        { participants: { some: { userId: adminId } } },
        { participants: { some: { userId: toUserId } } },
      ],
    },
    select: { id: true, state: true },
  });

  if (!convo) {
    convo = await prisma.conversation.create({
      data: {
        state: "ACTIVE",
        participants: {
          createMany: { data: [{ userId: adminId }, { userId: toUserId }] },
        },
      },
      select: { id: true, state: true },
    });
  } else if (convo.state !== "ACTIVE") {
    await prisma.conversation.update({
      where: { id: convo.id },
      data: { state: "ACTIVE" },
    });
    convo = { ...convo, state: "ACTIVE" };
  }

  if (note) {
    await prisma.message.create({
      data: { conversationId: convo.id, senderId: adminId, body: note },
    });
  }

  redirect(`/messages/${convo.id}`);
}

async function userRoleAction(formData: FormData) {
  "use server";
  await assertAdmin();
  const userId = String(formData.get("userId") || "");
  const toRole = String(formData.get("toRole") || "") as "ADMIN" | "USER";
  const returnTo = String(formData.get("returnTo") || "/admin/users");

  if (!userId || !toRole) {
    revalidatePath(returnTo);
    redirect(backWithBanner(returnTo, "Missing parameters", "error"));
  }

  await prisma.user.update({ where: { id: userId }, data: { role: toRole } });
  revalidatePath(returnTo);
  redirect(
    backWithBanner(
      returnTo,
      toRole === "ADMIN" ? "Promoted to admin" : "Demoted to user"
    )
  );
}

async function userStatusAction(formData: FormData) {
  "use server";
  const adminId = await assertAdmin();
  const userId = String(formData.get("userId") || "");
  const action = String(formData.get("action") || "") as
    | "SUSPEND"
    | "REINSTATE"
    | "EXPEL";
  const reason = String(formData.get("reason") || "") || undefined;
  const returnTo = String(formData.get("returnTo") || "/admin/users");

  if (!userId) {
    revalidatePath(returnTo);
    redirect(backWithBanner(returnTo, "Missing user", "error"));
  }

  let msg = "";
  if (action === "SUSPEND") {
    await prisma.user.update({
      where: { id: userId },
      data: { status: "SUSPENDED", suspendedUntil: null },
    });
    await prisma.moderationAction.create({
      data: {
        moderatorId: adminId,
        targetType: "USER",
        targetId: userId,
        action: "SUSPEND_USER",
        reason,
      },
    });
    msg = "User suspended";
  } else if (action === "REINSTATE") {
    await prisma.user.update({
      where: { id: userId },
      data: { status: "ACTIVE", suspendedUntil: null, expelledAt: null },
    });
    await prisma.moderationAction.create({
      data: {
        moderatorId: adminId,
        targetType: "USER",
        targetId: userId,
        action: "REINSTATE_USER",
        reason,
      },
    });
    msg = "User reinstated";
  } else if (action === "EXPEL") {
    await prisma.user.update({
      where: { id: userId },
      data: { status: "EXPELLED", expelledAt: new Date() },
    });
    await prisma.moderationAction.create({
      data: {
        moderatorId: adminId,
        targetType: "USER",
        targetId: userId,
        action: "EXPEL_USER",
        reason,
      },
    });
    msg = "User expelled";
  }

  revalidatePath(returnTo);
  redirect(backWithBanner(returnTo, msg));
}

/* ------------------ page ------------------ */
export default async function AdminUsersPage(ctx: {
  searchParams: Promise<{
    page?: string;
    pageSize?: string;
    role?: UserRole | typeof ALL;
    status?: UserStatus | typeof ALL;
    q?: string;
    sort?: SortKey;
    banner?: string;
    bannerType?: string;
  }>;
}) {
  await assertAdmin();

  const sp = await ctx.searchParams;
  const page = Math.max(1, Number.parseInt(sp.page || "1"));
  const pageSizeRaw = Number.parseInt(sp.pageSize || "20");
  const pageSize = Math.min(Math.max(pageSizeRaw || 20, 5), 100);
  const role = (sp.role || ALL) as UserRole | typeof ALL;
  const status = (sp.status || ALL) as UserStatus | typeof ALL;
  const q = (sp.q || "").trim();
  const sort = (sp.sort || "createdDesc") as SortKey;

  const where: Prisma.UserWhereInput = {
    ...(role !== ALL ? { role } : {}),
    ...(status !== ALL ? { status } : {}),
    ...(q
      ? {
          OR: [
            {
              handle: {
                contains: q,
                mode: Prisma.QueryMode.insensitive,
              },
            },
            {
              email: {
                contains: q,
                mode: Prisma.QueryMode.insensitive,
              },
            },
            {
              name: {
                contains: q,
                mode: Prisma.QueryMode.insensitive,
              },
            },
          ],
        }
      : {}),
  };

  // sorting
  const orderBy =
    sort === "createdAsc"
      ? [{ createdAt: "asc" as const }]
      : sort === "followersDesc"
      ? [{ followers: { _count: "desc" as const } }]
      : sort === "postsDesc"
      ? [{ posts: { _count: "desc" as const } }]
      : [{ createdAt: "desc" as const }]; // createdDesc default

  const [total, users] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        handle: true,
        name: true,
        email: true,
        image: true,
        role: true,
        status: true,
        createdAt: true,
        _count: {
          select: {
            followers: true, // via relation "Followers" in your schema (users who follow me)
            posts: true,
          },
        },
      },
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const qsBase = (next: Partial<Record<string, string>>) => {
    const params = new URLSearchParams({
      page: String(next.page ?? page),
      pageSize: String(next.pageSize ?? pageSize),
      role: String(next.role ?? role),
      status: String(next.status ?? status),
      q: String(next.q ?? q),
      sort: String(next.sort ?? sort),
    });
    return `/admin/users?${params.toString()}`;
  };
  const returnTo = qsBase({});

  return (
    <div className="mx-auto max-w-7xl p-4">
      <div className="flex justify-between px-3">
        {" "}
        <h1 className="mb-4 text-2xl font-semibold">users</h1>
        <ToastFromQuery />
        <Link href="/admin">
          <Button variant="outline">admin home</Button>
        </Link>
      </div>

      {/* Filters */}
      <form className="mb-4 flex flex-wrap items-end gap-3" method="get">
        <div className="flex flex-col">
          <label className="mb-1 text-xs text-muted-foreground">Role</label>
          <select
            name="role"
            defaultValue={role}
            className="rounded border px-2 py-1 text-sm"
          >
            <option value={ALL}>All</option>
            <option value="USER">USER</option>
            <option value="ADMIN">ADMIN</option>
          </select>
        </div>

        <div className="flex flex-col">
          <label className="mb-1 text-xs text-muted-foreground">Status</label>
          <select
            name="status"
            defaultValue={status}
            className="rounded border px-2 py-1 text-sm"
          >
            <option value={ALL}>All</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="SUSPENDED">SUSPENDED</option>
            <option value="EXPELLED">EXPELLED</option>
          </select>
        </div>

        <div className="flex flex-col">
          <label className="mb-1 text-xs text-muted-foreground">Sort</label>
          <select
            name="sort"
            defaultValue={sort}
            className="rounded border px-2 py-1 text-sm"
          >
            <option value="createdDesc">Newest</option>
            <option value="createdAsc">Oldest</option>
            <option value="followersDesc">Followers ↓</option>
            <option value="postsDesc">Posts ↓</option>
          </select>
        </div>

        <div className="flex items-end gap-2">
          <input
            name="q"
            defaultValue={q}
            placeholder="search handle, email, name…"
            className="rounded border px-2 py-1 text-sm"
          />
          <input type="hidden" name="page" value="1" />
          <Button type="submit" className="h-8 px-3 text-xs">
            Apply
          </Button>
          <Link href="/admin/users" className="inline-block">
            <Button
              variant="outline"
              type="button"
              className="h-8 px-3 text-xs"
            >
              Clear
            </Button>
          </Link>
        </div>

        <div className="ml-auto flex items-end gap-2">
          <label className="text-xs text-muted-foreground">Page size</label>
          <input
            name="pageSize"
            type="number"
            min={5}
            max={100}
            defaultValue={pageSize}
            className="w-24 rounded border px-2 py-1 text-sm"
          />
        </div>
      </form>

      {/* Pagination header */}
      <div className="mb-3 flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Showing <strong>{users.length}</strong> of <strong>{total}</strong>{" "}
          users
        </div>
        <div className="flex items-center gap-2">
          <Link href={qsBase({ page: String(Math.max(1, page - 1)) })}>
            <Button variant="outline" size="sm" disabled={page <= 1}>
              Prev
            </Button>
          </Link>
          <span className="text-sm">
            Page {page} / {totalPages}
          </span>
          <Link href={qsBase({ page: String(Math.min(totalPages, page + 1)) })}>
            <Button variant="outline" size="sm" disabled={page >= totalPages}>
              Next
            </Button>
          </Link>
        </div>
      </div>

      {/* Table */}
      {users.length === 0 ? (
        <p className="text-sm text-muted-foreground">No users found.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/40">
              <tr>
                <th className="px-3 py-2">User</th>
                <th className="px-3 py-2">Role</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Followers</th>
                <th className="px-3 py-2">Posts</th>
                <th className="px-3 py-2">Created</th>
                <th className="px-3 py-2">Messages</th>
                <th className="px-3 py-2">Actions</th>
                <th className="px-3 py-2">Notes</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const rowId = u.id; // use user id as row id for binder
                return (
                  <tr key={u.id} className="border-t align-top">
                    {/* User */}
                    <td className="px-3 py-3">
                      <div className="flex flex-col">
                        {u.handle ? (
                          <Link
                            href={`/u/${u.handle}`}
                            className="font-medium hover:underline"
                          >
                            @{u.handle}
                          </Link>
                        ) : (
                          <span className="font-medium">
                            {u.name || u.email || u.id}
                          </span>
                        )}
                        <div className="text-xs text-muted-foreground">
                          {u.name || u.email || "—"}
                        </div>
                      </div>
                    </td>

                    {/* Role */}
                    <td className="px-3 py-3">{u.role}</td>

                    {/* Status */}
                    <td className="px-3 py-3">{u.status}</td>

                    {/* Followers */}
                    <td className="px-3 py-3">{u._count.followers}</td>

                    {/* Posts */}
                    <td className="px-3 py-3">{u._count.posts}</td>

                    {/* Created */}
                    <td className="px-3 py-3 whitespace-nowrap">
                      {fmtDate(u.createdAt)}
                    </td>

                    {/* Messages */}
                    <td className="px-3 py-3">
                      <form
                        action={startAdminDM}
                        className="flex items-center gap-2"
                      >
                        <input type="hidden" name="toUserId" value={u.id} />
                        <input type="hidden" name="returnTo" value={returnTo} />
                        <input
                          type="hidden"
                          name="note"
                          data-note-for={rowId}
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 px-2"
                        >
                          message user
                        </Button>
                      </form>
                    </td>

                    {/* Actions */}
                    <td className="px-3 py-3">
                      <div className="grid grid-cols-3 gap-2">
                        {/* promote/demote */}
                        {u.role === "USER" ? (
                          <form action={userRoleAction} className="col-span-1">
                            <input type="hidden" name="userId" value={u.id} />
                            <input type="hidden" name="toRole" value="ADMIN" />
                            <input
                              type="hidden"
                              name="returnTo"
                              value={returnTo}
                            />
                            <Button
                              variant="secondary"
                              size="sm"
                              className="h-7 w-full px-2"
                            >
                              promote
                            </Button>
                          </form>
                        ) : (
                          <form action={userRoleAction} className="col-span-1">
                            <input type="hidden" name="userId" value={u.id} />
                            <input type="hidden" name="toRole" value="USER" />
                            <input
                              type="hidden"
                              name="returnTo"
                              value={returnTo}
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 w-full px-2"
                            >
                              demote
                            </Button>
                          </form>
                        )}

                        {/* suspend / expel */}
                        <form action={userStatusAction} className="col-span-1">
                          <input type="hidden" name="userId" value={u.id} />
                          <input type="hidden" name="action" value="SUSPEND" />
                          <input
                            type="hidden"
                            name="returnTo"
                            value={returnTo}
                          />
                          <input
                            type="hidden"
                            name="reason"
                            data-note-for={rowId}
                          />
                          <Button
                            variant="secondary"
                            size="sm"
                            className="h-7 w-full px-2"
                          >
                            suspend
                          </Button>
                        </form>

                        <form action={userStatusAction} className="col-span-1">
                          <input type="hidden" name="userId" value={u.id} />
                          <input type="hidden" name="action" value="EXPEL" />
                          <input
                            type="hidden"
                            name="returnTo"
                            value={returnTo}
                          />
                          <input
                            type="hidden"
                            name="reason"
                            data-note-for={rowId}
                          />
                          <Button
                            variant="destructive"
                            size="sm"
                            className="h-7 w-full px-2"
                          >
                            expel
                          </Button>
                        </form>

                        {/* reinstate full width */}
                        <form action={userStatusAction} className="col-span-3">
                          <input type="hidden" name="userId" value={u.id} />
                          <input
                            type="hidden"
                            name="action"
                            value="REINSTATE"
                          />
                          <input
                            type="hidden"
                            name="returnTo"
                            value={returnTo}
                          />
                          <input
                            type="hidden"
                            name="reason"
                            data-note-for={rowId}
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            className="mt-1 h-7 w-full px-2"
                          >
                            reinstate
                          </Button>
                        </form>
                      </div>
                    </td>

                    {/* Notes (shared per row) */}
                    <td className="px-3 py-3">
                      <input
                        data-note-source={rowId}
                        placeholder="optional moderator note…"
                        className="w-56 rounded border px-2 py-1 text-xs"
                        defaultValue=""
                      />
                      <div className="mt-1 text-[10px] text-muted-foreground">
                        Used for actions & messages
                      </div>
                      <RowNotesBinder rowId={rowId} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination footer */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-end gap-2">
          <Link href={qsBase({ page: String(Math.max(1, page - 1)) })}>
            <Button variant="outline" size="sm" disabled={page <= 1}>
              Prev
            </Button>
          </Link>
          <span className="text-sm">
            Page {page} / {totalPages}
          </span>
          <Link href={qsBase({ page: String(Math.min(totalPages, page + 1)) })}>
            <Button variant="outline" size="sm" disabled={page >= totalPages}>
              Next
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
