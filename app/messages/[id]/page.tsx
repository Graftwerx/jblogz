// app/messages/[id]/page.tsx
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import SendMessageBox from "@/components/messages/SendMessageBox";

export default async function ThreadPage(
  ctx: { params: Promise<{ id: string }> } // 👈 params is a Promise in Next 15
) {
  const { id } = await ctx.params; // 👈 await it

  const { getUser } = getKindeServerSession();
  const user = await getUser();
  if (!user) redirect("/");

  const convo = await prisma.conversation.findUnique({
    where: { id },
    include: {
      participants: {
        select: {
          userId: true,
          user: { select: { name: true, handle: true } },
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

  return (
    <div className="mx-auto flex max-w-3xl flex-col p-4">
      <header className="mb-4 border-b pb-3">
        <div className="text-sm text-muted-foreground">
          Conversation • {convo.participants.length} participants
        </div>
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
          </div>
        ))}
        {convo.messages.length === 0 && (
          <p className="text-sm text-muted-foreground">No messages yet.</p>
        )}
      </div>

      <div className="mt-4">
        {convo.state === "ACTIVE" ? (
          <SendMessageBox conversationId={convo.id} />
        ) : (
          <p className="text-sm text-muted-foreground">
            Waiting for acceptance before you can chat.
          </p>
        )}
      </div>
    </div>
  );
}
