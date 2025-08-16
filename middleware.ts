// middleware.ts
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const PUBLIC_PREFIXES = [
  "/",                  // home
  "/posts",             // listing (if you have it)
  "/post/",             // ANY /post/[id]
  "/u/",                // user profiles
  "/onboarding/handle", // onboarding page itself
  "/api/handle-status", // our status probe (must stay public)
  "/api/uploadthing",
  "/api/auth/",         // Kinde auth endpoints
  "/api/favorites",
];

function isPublic(pathname: string) {
  if (pathname === "/") return true;
  return PUBLIC_PREFIXES.some((p) => pathname.startsWith(p));
}

export async function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  // 1) Always allow public pages — NEVER force login
  if (isPublic(pathname)) {
    return NextResponse.next();
  }

  // 2) For non-public pages, only nudge *authenticated users* without a real handle.
  //    Ask our Node API which can use Prisma.
  const res = await fetch(`${req.nextUrl.origin}/api/handle-status`, {
    headers: { cookie: req.headers.get("cookie") ?? "" },
    cache: "no-store",
  });

  if (res.ok) {
    const data = (await res.json()) as {
      isAuthenticated: boolean;
      needsHandle: boolean;
    };

    if (data.isAuthenticated && data.needsHandle) {
      const url = new URL("/onboarding/handle", req.nextUrl.origin);
      url.searchParams.set("returnTo", pathname + (search || ""));
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // keep Next internals & static files excluded
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
  ],
};


