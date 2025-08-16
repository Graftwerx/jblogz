import Link from "next/link";
import Image from "next/image";
import {
  LoginLink,
  LogoutLink,
  RegisterLink,
} from "@kinde-oss/kinde-auth-nextjs/components";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { buttonVariants } from "../ui/button";
import { ModeToggle } from "../ModeToggle";
import { prisma } from "@/lib/prisma";

export async function Navbar() {
  const { getUser } = getKindeServerSession();
  const authUser = await getUser();

  // look up our local User row
  let handle: string | null = null;
  if (authUser) {
    const dbUser = await prisma.user.findUnique({
      where: { id: authUser.id },
      select: { handle: true },
    });
    handle = dbUser?.handle ?? null;
  }

  return (
    <nav className="py-5 flex items-center justify-between">
      <div className="flex items-center gap-12">
        <Link href={"/"}>
          <Image src={"/gistR3a.png"} alt="logo" height={48} width={96} />
        </Link>
        <div className="hidden sm:flex items-center gap-6">
          <Link
            href={"/"}
            className="text-sm font-medium hover:text-green-500 transition-colors"
          >
            home
          </Link>
          <Link
            href={"/dashboard"}
            className="text-sm font-medium hover:text-green-500 transition-colors"
          >
            dashboard
          </Link>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <ModeToggle />
        {authUser ? (
          <div className="flex items-center gap-4">
            {/* prefer handle if set, else fallback to Kinde name */}
            <p>@{handle ?? authUser.given_name}</p>
            <LogoutLink className={buttonVariants({ variant: "default" })}>
              logout
            </LogoutLink>
          </div>
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
