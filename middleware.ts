import { withAuth } from "@kinde-oss/kinde-auth-nextjs/middleware";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

// Keep your public paths the same + ensure onboarding + the status API are public
const PUBLIC_PATHS = [
  "/",                 // home
  "/posts",            // if you have it
  "/post/[id]",         // post detail (singular)
  "/onboarding/handle",
  "/api/uploadthing",
  "/api/uploadthing/:path*",
  "/api/auth/:path*",
  "/api/handle-status", // <-- our new status endpoint
];

// Helper: test if a path matches our simple patterns
function isPublicPath(pathname: string) {
  if (PUBLIC_PATHS.includes(pathname)) return true;
  // match "/post/:id"
  if (/^\/post\/[^/]+$/.test(pathname)) return true;
  // match any "/api/uploadthing/*"
  if (pathname.startsWith("/api/uploadthing/")) return true;
  // auth endpoints
  if (pathname.startsWith("/api/auth/")) return true;
  return false;
}

export default withAuth(
  async function middleware(req: NextRequest) {
    const { pathname, search } = req.nextUrl;
    // Never trap the onboarding page or any public path
    if (isPublicPath(pathname)) {
      return NextResponse.next();
    }

    // Ask API (with cookies) whether the viewer needs to pick a handle
    // IMPORTANT: Use absolute URL and forward cookies for session
    const base = req.nextUrl.origin;
    const res = await fetch(`${base}/api/handle-status`, {
      headers: { cookie: req.headers.get("cookie") ?? "" },
      // Avoid caching this check
      cache: "no-store",
    });

    if (res.ok) {
      const data = (await res.json()) as {
        isAuthenticated: boolean;
        needsHandle: boolean;
      };

      if (data.isAuthenticated && data.needsHandle) {
        // Build returnTo (original URL incl. querystring)
        const returnTo = pathname + (search || "");
        const url = new URL("/onboarding/handle", req.nextUrl.origin);
        url.searchParams.set("returnTo", returnTo);
        return NextResponse.redirect(url);
      }
    }

    // Otherwise, continue as usual
    return NextResponse.next();
  },
  {
    publicPaths: PUBLIC_PATHS,
  }
);

export const config = {
  matcher: [
    // your existing matcher; keeps _next/assets skipped
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
  ],
};
