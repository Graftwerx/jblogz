// app/settings/account/page.tsx
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import AccountForm from "./ui/AccountForm";

export default async function AccountPage() {
  const { getUser } = getKindeServerSession();
  const authUser = await getUser();
  if (!authUser) redirect("/");

  const user = await prisma.user.findUnique({
    where: { id: authUser.id },
    select: { handle: true, name: true, image: true, bio: true, email: true },
  });

  // If somehow missing, create a shell
  if (!user) {
    await prisma.user.create({
      data: {
        id: authUser.id,
        handle: `user_${authUser.id.slice(0, 8).toLowerCase()}`,
      },
    });
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Account</h1>
        <p className="text-sm text-muted-foreground">
          Update your profile details. Your handle is your public username.
        </p>
      </div>
      <AccountForm
        initial={{
          handle: user?.handle ?? "",
          name: user?.name ?? "",
          image: user?.image ?? "",
          bio: user?.bio ?? "",
          email: user?.email ?? "",
        }}
      />
    </div>
  );
}
