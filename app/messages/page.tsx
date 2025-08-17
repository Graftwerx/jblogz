// app/messages/page.tsx
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import RequestActions from "@/components/messages/RequestActions";

export default async function MessagesPage() {
  const { getUser } = getKindeServerSession();
  const user = await getUser();
  if (!user) redirect("/");

  // Pending requests sent TO me
  const requests = await prisma.messageRequest.findMany({
    where: { toUserId: user.id, status: "PENDING" },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      createdAt: true,
      fromUser: { select: { id: true, handle: true, name: true, image: true } },
    },
  });

  // My active conversations + last message
  const conversations = await prisma.conversation.findMany({
    where: {
      state: "ACTIVE",
      participants: { some: { userId: user.id } },
    },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      updatedAt: true,
      participants: {
        select: {
          user: { select: { id: true, handle: true, name: true, image: true } },
        },
      },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: {
          id: true,
          body: true,
          createdAt: true,
          senderId: true,
        },
      },
    },
  });

  // helper to show “other” participant
  const otherOf = (c: (typeof conversations)[number]) =>
    c.participants.map((p) => p.user).find((u) => u.id !== user.id);

  return (
    <div className="mx-auto max-w-3xl space-y-8 p-4">
      <h1 className="text-2xl font-semibold">Messages</h1>

      {/* Requests */}
      <section>
        <h2 className="mb-2 text-sm font-semibold text-muted-foreground">
          Requests
        </h2>
        <div className="space-y-3">
          {requests.map((r) => (
            <div
              key={r.id}
              className="flex items-center justify-between rounded border p-3"
            >
              <div className="text-sm">
                <div className="font-medium">
                  {r.fromUser?.name || `@${r.fromUser?.handle}` || "Unknown"}
                </div>
                <div className="text-xs text-muted-foreground">
                  sent {new Date(r.createdAt).toLocaleString()}
                </div>
              </div>
              <RequestActions requestId={r.id} />
            </div>
          ))}
          {requests.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No pending requests.
            </p>
          )}
        </div>
      </section>

      {/* Conversations */}
      <section>
        <h2 className="mb-2 text-sm font-semibold text-muted-foreground">
          Conversations
        </h2>
        <div className="space-y-3">
          {conversations.map((c) => {
            const other = otherOf(c);
            const last = c.messages[0];
            return (
              <Link
                key={c.id}
                href={`/messages/${c.id}`}
                className="block rounded border p-3 hover:bg-muted/40"
              >
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium">
                    {other?.name ||
                      (other?.handle ? `@${other.handle}` : "Conversation")}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(c.updatedAt).toLocaleString()}
                  </div>
                </div>
                {last && (
                  <div className="mt-1 truncate text-sm text-muted-foreground">
                    {last.senderId === user.id ? "You: " : ""}
                    {last.body}
                  </div>
                )}
              </Link>
            );
          })}
          {conversations.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No conversations yet.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
