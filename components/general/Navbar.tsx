import Image from "next/image";
import Link from "next/link";

import {
  LoginLink,
  LogoutLink,
  RegisterLink,
} from "@kinde-oss/kinde-auth-nextjs/components";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { buttonVariants } from "../ui/button";

export async function Navbar() {
  const { getUser } = getKindeServerSession();
  const user = await getUser();
  return (
    <nav className="py-5 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Link href={"/"}>
          <Image
            src={"/officialflag.png"}
            alt="logo"
            height={36}
            width={36}
          ></Image>
        </Link>
        <Link href={"/"}>
          {" "}
          <h1 className="text-3xl font-semibold">
            <span className="text-red-700">eeb</span>o
            <span className="text-yellow-400">b</span>l
            <span className="text-green-700">ogs</span>
          </h1>
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
      {user ? (
        <div className="flex items-center gap-4">
          <p>{user.given_name}</p>
          <LogoutLink className={buttonVariants({ variant: "default" })}>
            logout
          </LogoutLink>
        </div>
      ) : (
        <div className="flex items-center gap-4">
          <LoginLink className={buttonVariants({ variant: "default" })}>
            {" "}
            login
          </LoginLink>
          <RegisterLink className={buttonVariants({ variant: "secondary" })}>
            {" "}
            sign up
          </RegisterLink>
        </div>
      )}
    </nav>
  );
}
