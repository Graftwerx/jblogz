import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";

export async function GET() {
  const { getUser } = getKindeServerSession();
  const authUser = await getUser();

  if (!authUser) {
    return NextResponse.json({ isAuthenticated: false, needsHandle: false });
  }

  // Look up the local User row
  const user = await prisma.user.findUnique({
    where: { id: authUser.id },
    select: { handle: true },
  });

  // If no row yet, we consider it "needsHandle" to force onboarding
  const handle = user?.handle ?? "";
  const needsHandle =
    !handle || handle.startsWith("user_"); // your placeholder convention

  return NextResponse.json({ isAuthenticated: true, needsHandle });
}
