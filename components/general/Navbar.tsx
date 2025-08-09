import Image from "next/image";
import Link from "next/link";

import {
  LoginLink,
  LogoutLink,
  RegisterLink,
} from "@kinde-oss/kinde-auth-nextjs/components";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";

export async function Navbar() {
  const { getUser } = getKindeServerSession();
  const user = await getUser();
  return (
    <nav className="py-5 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Link href={"/"}>
          <Image
            src={"/emblemIN.png"}
            alt="logo"
            height={36}
            width={36}
          ></Image>
        </Link>
        <Link href={"/"}>
          {" "}
          <h1 className="text-3xl font-semibold">
            Ibo<span className="text-green-500">Blog</span>
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
          <LogoutLink className="bg-zinc-200 rounded-lg px-4 py-1 hover:text-green-500 transition-colors items-center">
            logout
          </LogoutLink>
        </div>
      ) : (
        <div className="flex items-center gap-4">
          <LoginLink className="bg-zinc-200 rounded-lg px-4 py-1 hover:text-green-500 transition-colors items-center">
            {" "}
            login
          </LoginLink>
          <RegisterLink className="bg-zinc-200 rounded-lg px-4 py-1 hover:text-green-500 transition-colors items-center">
            {" "}
            sign up
          </RegisterLink>
        </div>
      )}
    </nav>
  );
}
