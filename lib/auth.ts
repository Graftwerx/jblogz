
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";

/** Throws if not signed in. */
export async function requireUserId(): Promise<string> {
  const { getUser } = getKindeServerSession();
  const user = await getUser();

  if (!user?.id) {
    // Keep the message stable so route handlers can map it to 401.
    throw new Error("UNAUTHORIZED");
  }

  // Kinde user ids are strings (e.g. "kid_xxx")
  return user.id;
}

/** Returns userId or null without throwing (handy for GET endpoints). */
export async function getOptionalUserId(): Promise<string | null> {
  const { getUser } = getKindeServerSession();
  const user = await getUser();
  return user?.id ?? null;
}
