"use server";

import { prisma } from "@/lib/prisma";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

type State = { ok: boolean; error?: string };

const RESERVED = new Set([
  "admin","root","support","help","about","terms","privacy",
  "api","auth","login","logout","signup","settings","me",
  "user","users","post","posts","blog","dashboard","onboarding"
]);

function normalize(input: string) {
  const h = input.trim().toLowerCase();
  return h.replace(/[^a-z0-9_.]/g, "");
}

function isValid(handle: string) {
  if (handle.length < 3 || handle.length > 20) return false;
  if (!/^[a-z0-9]/.test(handle)) return false;
  if (!/^[a-z0-9._]+$/.test(handle)) return false;
  if (/[._]{2,}/.test(handle)) return false;
  if (/[._]$/.test(handle)) return false;
  return true;
}

export async function setHandle(prev: State, formData: FormData): Promise<State> {
  const { getUser } = getKindeServerSession();
  const authUser = await getUser();
  if (!authUser) return { ok: false, error: "Unauthorized" };

  const raw = (formData.get("handle") || "").toString();
  const returnTo = (formData.get("returnTo") || "/").toString();

  const next = normalize(raw);
  if (!isValid(next)) {
    return { ok: false, error: "Handle must be 3–20 chars (a–z, 0–9, _ .), start with a letter/number, no trailing _ or ." };
  }
  if (RESERVED.has(next)) return { ok: false, error: "This handle is reserved." };

  const existing = await prisma.user.findFirst({
    where: { handle: { equals: next, mode: "insensitive" } },
    select: { id: true },
  });
  if (existing && existing.id !== authUser.id) {
    return { ok: false, error: "That handle is taken." };
  }

  await prisma.user.update({
    where: { id: authUser.id },
    data: { handle: next },
  });

  revalidatePath("/");
  redirect(returnTo); // success -> leave this page
}

