import { prisma } from "@/lib/prisma";
import { assertAdmin } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import ToastFromQuery from "@/components/system/ToastFromQuery";
import RowNotesBinder from "@/components/admin/RowNotesBinder";
import { ReportStatus, ReportTargetType, ReportReason } from "@prisma/client";
import { revalidatePath } from "next/cache";

// app/admin/reports/page.tsx
export const dynamic = "force-dynamic"; // disable static pre-render
export const revalidate = 0; // no ISR
export const fetchCache = "force-no-store";

/* ------------------ utils ------------------ */
function fmtDate(d: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}
const ALL = "ALL" as const;
const REASONS: ReportReason[] = [
  "SPAM",
  "HARASSMENT",
  "HATE",
  "NUDITY",
  "VIOLENCE",
  "SELF_HARM",
  "COPYRIGHT",
  "OTHER",
];
const TARGETS: ReportTargetType[] = ["POST", "COMMENT", "MESSAGE", "USER"];
const STATUSES: ReportStatus[] = ["OPEN", "ACTION_TAKEN", "REJECTED"];

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
  // prefer per-row “note” mirrored via RowNotesBinder
  const note = (String(formData.get("note") || "") || "").trim();
  const returnTo = String(formData.get("returnTo") || "/admin/reports");

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

async function hideOrUnhideContent(formData: FormData) {
  "use server";
  const adminId = await assertAdmin();
  const targetType = formData.get("targetType") as ReportTargetType;
  const targetId = String(formData.get("targetId") || "");
  const doHide = String(formData.get("doHide")) === "true";
  const reason = String(formData.get("reason") || "") || undefined;
  const returnTo = String(formData.get("returnTo") || "/admin/reports");

  const now = new Date();
  if (targetType === "POST") {
    await prisma.blogPost.update({
      where: { id: targetId },
      data: doHide
        ? { hiddenAt: now, hiddenById: adminId }
        : { hiddenAt: null, hiddenById: null },
    });
  } else if (targetType === "COMMENT") {
    await prisma.comment.update({
      where: { id: targetId },
      data: doHide
        ? { hiddenAt: now, hiddenById: adminId }
        : { hiddenAt: null, hiddenById: null },
    });
  } else if (targetType === "MESSAGE") {
    await prisma.message.update({
      where: { id: targetId },
      data: doHide
        ? { hiddenAt: now, hiddenById: adminId }
        : { hiddenAt: null, hiddenById: null },
    });
  }

  await prisma.moderationAction.create({
    data: {
      moderatorId: adminId,
      targetType,
      targetId,
      action: doHide ? "HIDE_CONTENT" : "UNHIDE_CONTENT",
      reason,
    },
  });

  const msg = doHide ? "Content hidden" : "Content unhidden";
  revalidatePath(returnTo);
  redirect(backWithBanner(returnTo, msg, "success"));
}

async function resolveReport(formData: FormData) {
  "use server";
  const adminId = await assertAdmin();
  const reportId = String(formData.get("reportId") || "");
  const status = formData.get("status") as ReportStatus;
  const resolution = String(formData.get("resolution") || "") || undefined;
  const returnTo = String(formData.get("returnTo") || "/admin/reports");

  await prisma.report.update({
    where: { id: reportId },
    data: { status, resolution, resolvedById: adminId },
  });

  revalidatePath(returnTo);
  redirect(
    backWithBanner(returnTo, `Report marked ${status.toLowerCase()}`, "success")
  );
}

async function userAdminAction(formData: FormData) {
  "use server";
  const adminId = await assertAdmin();
  const userId = String(formData.get("userId") || "");
  const action = String(formData.get("action") || "") as
    | "SUSPEND"
    | "REINSTATE"
    | "EXPEL";
  const reason = String(formData.get("reason") || "") || undefined;
  const returnTo = String(formData.get("returnTo") || "/admin/reports");

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
  redirect(backWithBanner(returnTo, msg, "success"));
}

/* ------------------ page ------------------ */
export default async function AdminReportsPage(ctx: {
  searchParams: Promise<{
    page?: string;
    pageSize?: string;
    target?: ReportTargetType | typeof ALL;
    reason?: ReportReason | typeof ALL;
    status?: ReportStatus | typeof ALL;
    banner?: string;
    bannerType?: string;
  }>;
}) {
  await assertAdmin();

  const sp = await ctx.searchParams;
  const page = Math.max(1, Number.parseInt(sp.page || "1"));
  const pageSizeRaw = Number.parseInt(sp.pageSize || "20");
  const pageSize = Math.min(Math.max(pageSizeRaw || 20, 5), 100);
  const target = (sp.target || ALL) as ReportTargetType | typeof ALL;
  const reason = (sp.reason || ALL) as ReportReason | typeof ALL;
  const status = (sp.status || "OPEN") as ReportStatus | typeof ALL;

  // Build where without 'any'
  const where = {
    ...(target !== ALL ? { targetType: target as ReportTargetType } : {}),
    ...(reason !== ALL ? { reason: reason as ReportReason } : {}),
    ...(status !== ALL ? { status: status as ReportStatus } : {}),
  };

  const [total, reports] = await Promise.all([
    prisma.report.count({ where }),
    prisma.report.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        reporter: { select: { id: true, handle: true, name: true } },
        post: {
          select: {
            id: true,
            title: true,
            hiddenAt: true,
            authorId: true,
            author: {
              select: { id: true, handle: true, name: true, status: true },
            },
          },
        },
        comment: {
          select: {
            id: true,
            content: true,
            hiddenAt: true,
            postId: true,
            authorId: true,
            author: {
              select: { id: true, handle: true, name: true, status: true },
            },
          },
        },
        message: {
          select: {
            id: true,
            body: true,
            hiddenAt: true,
            conversationId: true,
            senderId: true,
            sender: {
              select: { id: true, handle: true, name: true, status: true },
            },
          },
        },
        userTarget: {
          select: { id: true, handle: true, name: true, status: true },
        },
      },
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const qsBase = (next: Partial<Record<string, string>>) => {
    const q = new URLSearchParams({
      page: String(next.page ?? page),
      pageSize: String(next.pageSize ?? pageSize),
      target: String(next.target ?? target),
      reason: String(next.reason ?? reason),
      status: String(next.status ?? status),
    });
    return `/admin/reports?${q.toString()}`;
  };
  const returnTo = qsBase({});

  return (
    <div className="mx-auto max-w-7xl p-4">
      <h1 className="mb-4 text-2xl font-semibold">Reports</h1>
      <ToastFromQuery />

      {/* Filters */}
      <form className="mb-4 flex flex-wrap items-end gap-3" method="get">
        <div className="flex flex-col">
          <label className="mb-1 text-xs text-muted-foreground">Target</label>
          <select
            name="target"
            defaultValue={target}
            className="rounded border px-2 py-1 text-sm"
          >
            <option value={ALL}>All</option>
            {TARGETS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col">
          <label className="mb-1 text-xs text-muted-foreground">Reason</label>
          <select
            name="reason"
            defaultValue={reason}
            className="rounded border px-2 py-1 text-sm"
          >
            <option value={ALL}>All</option>
            {REASONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col">
          <label className="mb-1 text-xs text-muted-foreground">Status</label>
          <select
            name="status"
            defaultValue={status}
            className="rounded border px-2 py-1 text-sm"
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
            <option value={ALL}>All</option>
          </select>
        </div>

        <div className="flex flex-col">
          <label className="mb-1 text-xs text-muted-foreground">
            Page size
          </label>
          <input
            name="pageSize"
            type="number"
            min={5}
            max={100}
            defaultValue={pageSize}
            className="w-24 rounded border px-2 py-1 text-sm"
          />
        </div>

        <input type="hidden" name="page" value="1" />
        <Button type="submit" className="h-8 px-3 text-xs">
          Apply
        </Button>
        <Link href="/admin/reports" className="inline-block">
          <Button variant="outline" type="button" className="h-8 px-3 text-xs">
            Clear
          </Button>
        </Link>
      </form>

      {/* Pagination header */}
      <div className="mb-3 flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Showing <strong>{reports.length}</strong> of <strong>{total}</strong>{" "}
          reports
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
      {reports.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No reports match your filters.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/40">
              <tr>
                <th className="px-3 py-2">Target</th>
                <th className="px-3 py-2">Reason</th>
                <th className="px-3 py-2">Reporter</th>
                <th className="px-3 py-2">Notes</th>
                <th className="px-3 py-2">User Status</th>
                <th className="px-3 py-2">Report Status</th>
                <th className="px-3 py-2">Messages</th>
                <th className="px-3 py-2">Actions</th>
                <th className="px-3 py-2">Created</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((r) => {
                const isPost = r.targetType === "POST";
                const isComment = r.targetType === "COMMENT";
                const isMessage = r.targetType === "MESSAGE";
                const isUser = r.targetType === "USER";

                const targetHidden =
                  (isPost && r.post?.hiddenAt) ||
                  (isComment && r.comment?.hiddenAt) ||
                  (isMessage && r.message?.hiddenAt)
                    ? true
                    : false;

                const owner = isPost
                  ? r.post?.author
                  : isComment
                  ? r.comment?.author
                  : isMessage
                  ? r.message?.sender
                  : isUser
                  ? r.userTarget
                  : null;

                let targetLabel = "";
                let targetHref: string | null = null;
                if (isPost && r.post) {
                  targetLabel = `Post: ${r.post.title}`;
                  targetHref = `/post/${r.post.id}`;
                } else if (isComment && r.comment) {
                  targetLabel = `Comment: ${r.comment.content.slice(0, 40)}`;
                  targetHref = `/post/${r.comment.postId}#comment-${r.comment.id}`;
                } else if (isMessage && r.message) {
                  targetLabel = `Message: ${r.message.body.slice(0, 40)}`;
                  targetHref = `/messages/${r.message.conversationId}`;
                } else if (isUser && r.userTarget) {
                  targetLabel = `User: ${
                    r.userTarget.name || "@" + r.userTarget.handle
                  }`;
                  targetHref = `/u/${r.userTarget.handle}`;
                } else {
                  targetLabel = `${r.targetType}: ${r.targetId}`;
                }

                return (
                  <tr key={r.id} className="border-t align-top">
                    {/* Target */}
                    <td className="px-3 py-3">
                      {targetHref ? (
                        <Link
                          href={targetHref}
                          className="font-medium hover:underline"
                        >
                          {targetLabel}
                        </Link>
                      ) : (
                        <span className="font-medium">{targetLabel}</span>
                      )}
                      <div className="text-xs text-muted-foreground">
                        type: {r.targetType}
                      </div>
                      {!isUser && targetHidden && (
                        <div className="text-xs text-red-600">hidden</div>
                      )}
                    </td>

                    {/* Reason */}
                    <td className="px-3 py-3">{r.reason}</td>

                    {/* Reporter */}
                    <td className="px-3 py-3">
                      {r.reporter.handle ? (
                        <Link
                          href={`/u/${r.reporter.handle}`}
                          className="hover:underline"
                        >
                          @{r.reporter.handle}
                        </Link>
                      ) : (
                        r.reporter.name || r.reporter.id
                      )}
                    </td>

                    {/* Notes (shared per row) */}
                    <td className="px-3 py-3">
                      <input
                        data-note-source={r.id}
                        placeholder="optional moderator note…"
                        className="w-56 rounded border px-2 py-1 text-xs"
                        defaultValue=""
                      />
                      <div className="mt-1 text-[10px] text-muted-foreground">
                        Used for actions, resolution & messages
                      </div>
                      <RowNotesBinder rowId={r.id} />
                    </td>

                    {/* User Status */}
                    <td className="px-3 py-3">{owner ? owner.status : "—"}</td>

                    {/* Report Status */}
                    <td className="px-3 py-3">{r.status}</td>

                    {/* Messages */}
                    <td className="px-3 py-3">
                      <div className="flex flex-col gap-2">
                        {owner && (
                          <form
                            action={startAdminDM}
                            className="flex items-center gap-2"
                          >
                            <input
                              type="hidden"
                              name="toUserId"
                              value={owner.id}
                            />
                            <input
                              type="hidden"
                              name="returnTo"
                              value={returnTo}
                            />
                            {/* mirror row note into message body */}
                            <input
                              type="hidden"
                              name="note"
                              data-note-for={r.id}
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 px-2"
                            >
                              message owner
                            </Button>
                          </form>
                        )}
                        <form
                          action={startAdminDM}
                          className="flex items-center gap-2"
                        >
                          <input
                            type="hidden"
                            name="toUserId"
                            value={r.reporter.id}
                          />
                          <input
                            type="hidden"
                            name="returnTo"
                            value={returnTo}
                          />
                          <input
                            type="hidden"
                            name="note"
                            data-note-for={r.id}
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 px-2"
                          >
                            message reporter
                          </Button>
                        </form>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="px-3 py-3">
                      <div className="grid grid-cols-3 gap-2">
                        {/* Hide/Unhide (for content targets) */}
                        {!isUser && (
                          <form
                            action={hideOrUnhideContent}
                            className="col-span-1"
                          >
                            <input
                              type="hidden"
                              name="targetType"
                              value={r.targetType}
                            />
                            <input
                              type="hidden"
                              name="targetId"
                              value={r.targetId}
                            />
                            <input
                              type="hidden"
                              name="doHide"
                              value={(!(
                                (isPost && r.post?.hiddenAt) ||
                                (isComment && r.comment?.hiddenAt) ||
                                (isMessage && r.message?.hiddenAt)
                              )).toString()}
                            />
                            <input
                              type="hidden"
                              name="returnTo"
                              value={returnTo}
                            />
                            {/* notes mirrored */}
                            <input
                              type="hidden"
                              name="reason"
                              data-note-for={r.id}
                            />
                            <Button
                              variant={targetHidden ? "outline" : "destructive"}
                              size="sm"
                              className="h-7 w-full px-2"
                            >
                              {targetHidden ? "unhide" : "hide"}
                            </Button>
                          </form>
                        )}

                        {/* Suspend / Expel (owner) */}
                        {owner && (
                          <>
                            <form
                              action={userAdminAction}
                              className="col-span-1"
                            >
                              <input
                                type="hidden"
                                name="userId"
                                value={owner.id}
                              />
                              <input
                                type="hidden"
                                name="action"
                                value="SUSPEND"
                              />
                              <input
                                type="hidden"
                                name="returnTo"
                                value={returnTo}
                              />
                              <input
                                type="hidden"
                                name="reason"
                                data-note-for={r.id}
                              />
                              <Button
                                variant="secondary"
                                size="sm"
                                className="h-7 w-full px-2"
                              >
                                suspend
                              </Button>
                            </form>

                            <form
                              action={userAdminAction}
                              className="col-span-1"
                            >
                              <input
                                type="hidden"
                                name="userId"
                                value={owner.id}
                              />
                              <input
                                type="hidden"
                                name="action"
                                value="EXPEL"
                              />
                              <input
                                type="hidden"
                                name="returnTo"
                                value={returnTo}
                              />
                              <input
                                type="hidden"
                                name="reason"
                                data-note-for={r.id}
                              />
                              <Button
                                variant="destructive"
                                size="sm"
                                className="h-7 w-full px-2"
                              >
                                expel
                              </Button>
                            </form>
                          </>
                        )}

                        {/* Reinstate full-width (spans 3) */}
                        {owner && (
                          <form action={userAdminAction} className="col-span-3">
                            <input
                              type="hidden"
                              name="userId"
                              value={owner.id}
                            />
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
                              data-note-for={r.id}
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              className="mt-1 h-7 w-full px-2"
                            >
                              reinstate
                            </Button>
                          </form>
                        )}

                        {/* Resolve report row (spans 3) */}
                        <form
                          action={resolveReport}
                          className="col-span-3 mt-1 flex gap-2"
                        >
                          <input type="hidden" name="reportId" value={r.id} />
                          <input
                            type="hidden"
                            name="returnTo"
                            value={returnTo}
                          />
                          {/* use the notes value as resolution text */}
                          <input
                            type="hidden"
                            name="resolution"
                            data-note-for={r.id}
                          />
                          <Button
                            name="status"
                            value="ACTION_TAKEN"
                            size="sm"
                            className="h-7 px-2"
                          >
                            resolve: action taken
                          </Button>
                          <Button
                            name="status"
                            value="REJECTED"
                            variant="outline"
                            size="sm"
                            className="h-7 px-2"
                          >
                            resolve: reject
                          </Button>
                        </form>
                      </div>
                    </td>

                    {/* Created */}
                    <td className="whitespace-nowrap px-3 py-3">
                      {fmtDate(r.createdAt)}
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
