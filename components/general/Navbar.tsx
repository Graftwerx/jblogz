import Link from "next/link";
import Image from "next/image";
import {
  LoginLink,
  RegisterLink,
} from "@kinde-oss/kinde-auth-nextjs/components";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { buttonVariants } from "../ui/button";
import { ModeToggle } from "../ModeToggle";
import { prisma } from "@/lib/prisma";
import { UserMenu } from "./UserMenu"; // ⬅️ client subcomponent

export async function Navbar() {
  const { getUser } = getKindeServerSession();
  const authUser = await getUser();

  let handle: string | null = null;
  if (authUser) {
    const dbUser = await prisma.user.findUnique({
      where: { id: authUser.id },
      select: { handle: true },
    });
    handle = dbUser?.handle ?? null;
  }

  const settingsUrl = "/settings/account";
  const createPostUrl = "/dashboard/create"; // adjust if your route differs
  const dashboardUrl = "/dashboard";

  return (
    <nav className="py-5 flex items-center justify-between">
      <div className="flex items-center gap-12">
        <Link href="/">
          <Image src="/gistR3a.png" alt="logo" height={48} width={96} />
        </Link>

        {/* Primary nav: hide "home" for unauthenticated; keep Dashboard for authed */}
        <div className="hidden sm:flex items-center gap-6">
          {authUser && (
            <Link
              href={dashboardUrl}
              className="text-sm font-medium hover:text-green-500 transition-colors"
            >
              dashboard
            </Link>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4">
        <ModeToggle />

        {authUser ? (
          <UserMenu
            displayName={
              handle ? `@${handle}` : authUser.given_name || "Account"
            }
            avatarUrl={authUser.picture || undefined}
            settingsUrl={settingsUrl}
            createPostUrl={createPostUrl}
          />
        ) : (
          <div className="flex items-center gap-4">
            <LoginLink className={buttonVariants({ variant: "default" })}>
              login
            </LoginLink>
            <RegisterLink className={buttonVariants({ variant: "secondary" })}>
              sign up
            </RegisterLink>
          </div>
        )}
      </div>
    </nav>
  );
}
