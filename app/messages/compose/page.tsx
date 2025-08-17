import { prisma } from "@/lib/prisma";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import ComposeRequestForm from "@/components/messages/ComposeRequestForm";

export default async function ComposePage(
  ctx: { searchParams: Promise<{ to?: string }> } // 👈 Promise
) {
  const { to } = await ctx.searchParams; // 👈 await

  const { getUser } = getKindeServerSession();
  const viewer = await getUser();
  if (!viewer) redirect("/");

  const toUserId = to;
  if (!toUserId) redirect("/messages");

  const user = await prisma.user.findUnique({
    where: { id: toUserId },
    select: { id: true, name: true, handle: true, image: true },
  });
  if (!user) redirect("/messages");

  // avatar fallback to last post's authorImage
  let avatar = user.image || null;
  if (!avatar) {
    const lastPost = await prisma.blogPost.findFirst({
      where: { authorId: user.id },
      orderBy: { createdAt: "desc" },
      select: { authorImage: true },
    });
    avatar = lastPost?.authorImage ?? "/default-avatar.png";
  }

  return (
    <div className="mx-auto max-w-xl p-4">
      <div className="mb-4 flex items-center justify-between">
        <Link
          href="/messages"
          className="text-sm text-muted-foreground hover:underline"
        >
          ← back to inbox
        </Link>
      </div>

      <div className="mb-4 flex items-center gap-3">
        <Image
          src={avatar}
          alt={user.name || `@${user.handle}`}
          width={40}
          height={40}
          className="rounded-full"
        />
        <div className="leading-tight">
          <div className="font-medium">
            {user.name || (user.handle ? `@${user.handle}` : "User")}
          </div>
          {user.handle && (
            <div className="text-sm text-muted-foreground">@{user.handle}</div>
          )}
        </div>
      </div>

      <ComposeRequestForm toUserId={user.id} />
    </div>
  );
}
