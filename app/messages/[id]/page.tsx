// app/messages/[id]/page.tsx
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import SendMessageBox from "@/components/messages/SendMessageBox";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import ToastFromQuery from "@/components/system/ToastFromQuery";
import { revalidatePath } from "next/cache";
import { FlagButton } from "@/components/moderation/FlagButton";

/* ---------- helpers ---------- */
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

/* ---------- server actions ---------- */
async function blockUserAction(formData: FormData) {
  "use server";
  const { getUser } = getKindeServerSession();
  const me = await getUser();
  if (!me) redirect("/");

  const targetId = String(formData.get("targetId") || "");
  const returnTo = String(formData.get("returnTo") || "/messages");

  if (!targetId || targetId === me.id) {
    redirect(backWithBanner(returnTo, "Invalid target", "error"));
  }

  const exists = await prisma.block.findUnique({
    where: {
      blocker_blocked_unique: { blockerId: me.id, blockedId: targetId },
    },
    select: { id: true },
  });
  if (!exists) {
    await prisma.block.create({
      data: { blockerId: me.id, blockedId: targetId },
    });
  }

  revalidatePath(returnTo);
  redirect(backWithBanner(returnTo, "User blocked"));
}

async function unblockUserAction(formData: FormData) {
  "use server";
  const { getUser } = getKindeServerSession();
  const me = await getUser();
  if (!me) redirect("/");

  const targetId = String(formData.get("targetId") || "");
  const returnTo = String(formData.get("returnTo") || "/messages");

  await prisma.block.deleteMany({
    where: { blockerId: me.id, blockedId: targetId },
  });

  revalidatePath(returnTo);
  redirect(backWithBanner(returnTo, "User unblocked"));
}

/* ---------- page ---------- */
export default async function ThreadPage(ctx: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await ctx.params;

  const { getUser } = getKindeServerSession();
  const user = await getUser();
  if (!user) redirect("/");

  const convo = await prisma.conversation.findUnique({
    where: { id },
    include: {
      participants: {
        select: {
          userId: true,
          user: { select: { id: true, name: true, handle: true } },
        },
      },
      messages: {
        orderBy: { createdAt: "asc" },
        take: 100,
        select: { id: true, body: true, createdAt: true, senderId: true },
      },
    },
  });

  if (!convo) return notFound();
  const isMember = convo.participants.some((p) => p.userId === user.id);
  if (!isMember) return notFound();

  const others = convo.participants.filter((p) => p.userId !== user.id);
  const isOneToOne = convo.participants.length === 2;
  const other = isOneToOne ? others[0]?.user : undefined;

  // block state
  let youBlocked = false;
  let blockedYou = false;
  if (other) {
    const blocks = await prisma.block.findMany({
      where: {
        OR: [
          { blockerId: user.id, blockedId: other.id },
          { blockerId: other.id, blockedId: user.id },
        ],
      },
      select: { blockerId: true, blockedId: true },
    });
    youBlocked = blocks.some(
      (b) => b.blockerId === user.id && b.blockedId === other.id
    );
    blockedYou = blocks.some(
      (b) => b.blockerId === other.id && b.blockedId === user.id
    );
  }

  const handles = convo.participants
    .map((p) => (p.user.handle ? `@${p.user.handle}` : p.user.name || "User"))
    .join(" and ");

  const sendDisabledReason =
    convo.state !== "ACTIVE"
      ? "You can’t send messages in this conversation yet."
      : youBlocked
      ? "You blocked this user. Unblock to send messages."
      : blockedYou
      ? "This user has blocked you. You can’t send messages."
      : null;

  const returnTo = `/messages/${id}`;

  return (
    <div className="mx-auto flex max-w-3xl flex-col p-4">
      <ToastFromQuery />

      <header className="mb-4 flex items-center justify-between border-b pb-3">
        <div className="text-sm font-medium">
          Conversation between {handles}
        </div>
        {other && (
          <div className="flex items-center gap-2">
            {other.handle && (
              <Link
                href={`/u/${other.handle}`}
                className="text-xs text-muted-foreground hover:underline"
              >
                @{other.handle}
              </Link>
            )}

            {youBlocked ? (
              <form action={unblockUserAction}>
                <input type="hidden" name="targetId" value={other.id} />
                <input type="hidden" name="returnTo" value={returnTo} />
                <Button variant="outline" size="sm" className="h-7 px-2">
                  Unblock
                </Button>
              </form>
            ) : (
              <form action={blockUserAction}>
                <input type="hidden" name="targetId" value={other.id} />
                <input type="hidden" name="returnTo" value={returnTo} />
                <Button variant="destructive" size="sm" className="h-7 px-2">
                  Block
                </Button>
              </form>
            )}
          </div>
        )}
      </header>

      <div className="flex flex-1 flex-col gap-3 overflow-y-auto py-2">
        {convo.messages.map((m) => (
          <div
            key={m.id}
            className={`max-w-[80%] rounded-lg border p-2 text-sm ${
              m.senderId === user.id ? "self-end bg-muted/40" : "self-start"
            }`}
          >
            <div>{m.body}</div>
            <div className="mt-1 text-[10px] text-muted-foreground">
              {new Date(m.createdAt).toLocaleString()}
            </div>
            <FlagButton targetType="MESSAGE" targetId={m.id} />
          </div>
        ))}
        {convo.messages.length === 0 && (
          <p className="text-sm text-muted-foreground">No messages yet.</p>
        )}
      </div>

      <div className="mt-4">
        {sendDisabledReason ? (
          <p className="text-sm text-muted-foreground">{sendDisabledReason}</p>
        ) : (
          <SendMessageBox conversationId={convo.id} />
        )}
      </div>
    </div>
  );
}
