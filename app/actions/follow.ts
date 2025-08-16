"use server";

import { prisma } from "@/lib/prisma";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { revalidatePath } from "next/cache";

async function requireUser() {
  const { getUser } = getKindeServerSession();
  const u = await getUser();
  if (!u) throw new Error("Unauthorized");
  return u;
}

export async function followUser(targetUserId: string, revalidate: string[] = []) {
  const u = await requireUser();
  if (u.id === targetUserId) throw new Error("Cannot follow yourself");

  await prisma.$transaction(async (tx) => {
    await tx.follow.upsert({
      where: { followerId_followingId: { followerId: u.id, followingId: targetUserId } },
      update: {},
      create: { followerId: u.id, followingId: targetUserId },
    });
    await tx.activity.create({
      data: { actorId: u.id, type: "USER_FOLLOWED", targetUserId },
    });
  });

  for (const p of revalidate) revalidatePath(p);
}

export async function unfollowUser(targetUserId: string, revalidate: string[] = []) {
  const u = await requireUser();

  await prisma.follow.delete({
    where: { followerId_followingId: { followerId: u.id, followingId: targetUserId } },
  });

  for (const p of revalidate) revalidatePath(p);
}

export async function isFollowing(targetUserId: string) {
  const u = await requireUser();
  const f = await prisma.follow.findUnique({
    where: { followerId_followingId: { followerId: u.id, followingId: targetUserId } },
    select: { followerId: true },
  });
  return !!f;
}
