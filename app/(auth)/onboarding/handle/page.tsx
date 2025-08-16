// app/(auth)/onboarding/handle/page.tsx
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import HandleForm from "./ui/HandleForm";

type SP = Promise<{ returnTo?: string }>;

export default async function Page({ searchParams }: { searchParams: SP }) {
  const { getUser } = getKindeServerSession();
  const authUser = await getUser();
  if (!authUser) redirect("/");

  const { handle } = (await prisma.user.findUnique({
    where: { id: authUser.id },
    select: { handle: true },
  })) ?? { handle: undefined };

  // already has a real handle? bounce back
  const sp = await searchParams; // <-- IMPORTANT
  const returnTo = sp?.returnTo || "/";

  if (handle && !handle.startsWith("user_")) {
    redirect(returnTo);
  }

  return (
    <div className="mx-auto max-w-md px-4 py-10">
      <h1 className="mb-2 text-2xl font-semibold">Choose your handle</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Letters, numbers, <code>_</code> and <code>.</code>. 3–20 characters.
      </p>
      <HandleForm returnTo={returnTo} />
    </div>
  );
}
