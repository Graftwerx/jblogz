"use client";

import { useTransition, useState } from "react";
import { followUser, unfollowUser } from "@/app/actions/follow";
import { LoginLink } from "@kinde-oss/kinde-auth-nextjs/components";

type Props = {
  targetUserId: string;
  initialIsFollowing: boolean;
  revalidate?: string[]; // paths to revalidate after action (e.g. ["/u/kinglouie"])
  isAuthenticated: boolean; // pass from server to know whether to show Login
};

export default function FollowButton({
  targetUserId,
  initialIsFollowing,
  revalidate = [],
  isAuthenticated,
}: Props) {
  const [isFollowingState, setIsFollowing] = useState(initialIsFollowing);
  const [pending, start] = useTransition();

  if (!isAuthenticated) {
    return (
      <LoginLink>
        <button className="rounded-md border px-3 py-1.5 text-sm">
          Follow
        </button>
      </LoginLink>
    );
  }

  const onClick = () =>
    start(async () => {
      try {
        if (isFollowingState) {
          await unfollowUser(targetUserId, revalidate);
          setIsFollowing(false);
        } else {
          await followUser(targetUserId, revalidate);
          setIsFollowing(true);
        }
      } catch (e) {
        // optional: toast
        console.error(e);
      }
    });

  return (
    <button
      onClick={onClick}
      disabled={pending}
      className={`rounded-md px-3 py-1.5 text-sm ${
        isFollowingState ? "border" : "bg-black text-white"
      } disabled:opacity-50`}
      aria-pressed={isFollowingState}
    >
      {pending ? "…" : isFollowingState ? "Unfollow" : "Follow"}
    </button>
  );
}
