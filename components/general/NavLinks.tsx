// components/layout/NavLinks.tsx (Client Component)
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

export function NavLinks({ isAuthed }: { isAuthed: boolean }) {
  const pathname = usePathname();

  // Helper for active style
  const link = (href: string, label: string) => {
    const active = pathname === href;
    return (
      <Link
        href={href}
        aria-current={active ? "page" : undefined}
        className={clsx(
          "text-sm font-medium transition-colors",
          active ? "text-green-600" : "text-foreground/80 hover:text-green-500"
        )}
      >
        {label}
      </Link>
    );
  };

  if (!isAuthed) {
    // For guests you said “home” felt redundant — keep it empty to mirror your previous behavior.
    // If you change your mind, return link("/", "home") here.
    return null;
  }

  // Authenticated: show Home and Dashboard
  return (
    <>
      {link("/", "home")}
      {link("/dashboard", "dashboard")}
    </>
  );
}
