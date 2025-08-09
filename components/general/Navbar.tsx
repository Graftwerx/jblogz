import Image from "next/image";
import Link from "next/link";
import { Button } from "../ui/button";

export function Navbar() {
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
      <div className="flex items-center gap-4">
        <Button
          variant={"default"}
          className="bg-zinc-100 rounded-xl hover:text-green-500 transition-colors"
        >
          log in
        </Button>
        <Button
          variant={"secondary"}
          className="bg-zinc-100 rounded-xl hover:text-green-500 transition-colors"
        >
          sign up
        </Button>
      </div>
    </nav>
  );
}
