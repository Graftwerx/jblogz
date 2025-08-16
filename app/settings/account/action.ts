"use server";

import { prisma } from "@/lib/prisma";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export type State = { ok: boolean; error?: string };

const RESERVED = new Set([
  "admin","root","support","help","about","terms","privacy",
  "api","auth","login","logout","signup","settings","me",
  "user","users","post","posts","blog","dashboard","onboarding",
]);

function normalizeHandle(input: string) {
  const h = input.trim().toLowerCase();
  return h.replace(/[^a-z0-9_.]/g, "");
}

function isValidHandle(handle: string) {
  if (handle.length < 3 || handle.length > 20) return false;
  if (!/^[a-z0-9]/.test(handle)) return false;
  if (!/^[a-z0-9._]+$/.test(handle)) return false;
  if (/[._]{2,}/.test(handle)) return false;
  if (/[._]$/.test(handle)) return false;
  return true;
}

export async function updateAccount(prev: State, formData: FormData): Promise<State> {
  const { getUser } = getKindeServerSession();
  const authUser = await getUser();
  if (!authUser) return { ok: false, error: "Unauthorized" };

  const name = (formData.get("name") || "").toString().trim() || null;
  const image = (formData.get("image") || "").toString().trim() || null;
  const bio = (formData.get("bio") || "").toString().trim() || null;

  const rawHandle = (formData.get("handle") || "").toString();
  let handle: string | null = null;

  if (rawHandle) {
    const next = normalizeHandle(rawHandle);
    if (!isValidHandle(next)) {
      return { ok: false, error: "Invalid handle. Use 3–20 chars a–z, 0–9, _ or ., start/end with a letter/number." };
    }
    if (RESERVED.has(next)) return { ok: false, error: "This handle is reserved." };

    const clash = await prisma.user.findFirst({
      where: { handle: { equals: next, mode: "insensitive" }, NOT: { id: authUser.id } },
      select: { id: true },
    });
    if (clash) return { ok: false, error: "That handle is taken." };
    handle = next;
  }

  await prisma.user.update({
    where: { id: authUser.id },
    data: { name, image, bio, ...(handle ? { handle } : {}) },
  });

  revalidatePath("/settings/account");
  revalidatePath("/dashboard");

  // On success, navigate to dashboard (this throws and never returns)
  redirect("/dashboard?updated=1");
}
