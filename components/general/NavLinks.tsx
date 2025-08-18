// components/layout/NavLinks.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

export function NavLinks({
  isAuthed,
  isAdmin = false,
}: {
  isAuthed: boolean;
  isAdmin?: boolean;
}) {
  const pathname = usePathname();

  const link = (href: string, label: string) => (
    <Link
      key={href}
      href={href}
      className={clsx(
        "text-sm font-medium transition-colors",
        pathname === href
          ? "text-foreground"
          : "text-muted-foreground hover:text-foreground"
      )}
    >
      {label}
    </Link>
  );

  return (
    <div className="flex items-center gap-6">
      {/* Home for authed users too, per your flow */}
      {link("/", "home")}
      {isAuthed && link("/dashboard", "dashboard")}
      {isAdmin && link("/admin", "admin")}
    </div>
  );
}
