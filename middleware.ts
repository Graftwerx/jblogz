// middleware.ts
import { withAuth } from "@kinde-oss/kinde-auth-nextjs/middleware";

export default withAuth(
  async function middleware() {
    // no-op
  },
  {
    publicPaths: [
      "/",
      "/api/uploadthing",
      "/api/uploadthing/:path*", // allow the POST + internal callbacks
      "/api/auth/:path*",        // kinde auth endpoints too
    ],
  }
);

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
  ],
};
