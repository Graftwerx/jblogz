"use client";
import * as React from "react";
import Link from "next/link";
import { LogoutLink } from "@kinde-oss/kinde-auth-nextjs/components";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "../ui/dropdown-menu";
import { Settings, PlusSquare, LogOut, User as UserIcon } from "lucide-react";

export function UserMenu({
  displayName,
  avatarUrl,
  settingsUrl,
  createPostUrl,
}: {
  displayName: string;
  avatarUrl?: string;
  settingsUrl: string;
  createPostUrl: string;
}) {
  // Avatar fallback: first letter
  const initial = (displayName?.replace(/^@/, "").trim() || "U")
    .charAt(0)
    .toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-10 w-10 p-0 rounded-full">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatarUrl}
              alt={displayName}
              className="h-10 w-10 rounded-full object-cover"
            />
          ) : (
            <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-sm font-medium">
              {initial}
            </div>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="flex items-center gap-2">
          <UserIcon className="h-4 w-4" />
          <span className="truncate" title={displayName}>
            {displayName}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href={settingsUrl} className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            <span>Settings</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href={createPostUrl} className="flex items-center gap-2">
            <PlusSquare className="h-4 w-4" />
            <span>Create post</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <LogoutLink className="flex items-center gap-2 cursor-pointer">
            <LogOut className="h-4 w-4" />
            <span>Logout</span>
          </LogoutLink>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
