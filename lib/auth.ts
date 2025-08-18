// lib/auth.ts
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { prisma } from "@/lib/prisma";

/** Throws if not signed in. */
export async function requireUserId(): Promise<string> {
  const { getUser } = getKindeServerSession();
  const user = await getUser();
  if (!user?.id) throw new Error("UNAUTHORIZED");
  return user.id;
}

/** Returns userId or null without throwing (handy for GET endpoints). */
export async function getOptionalUserId(): Promise<string | null> {
  const { getUser } = getKindeServerSession();
  const user = await getUser();
  return user?.id ?? null;
}

export async function isAdmin(userId?: string | null): Promise<boolean> {
  if (!userId) return false;
  const u = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  return u?.role === "ADMIN";
}

/** Throws if requester is not ADMIN. Returns the admin's userId if OK. */
export async function assertAdmin(): Promise<string> {
  const userId = await requireUserId();
  const dbUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  if (!dbUser || dbUser.role !== "ADMIN") {
    throw new Error("FORBIDDEN");
  }
  return userId;
}

