import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/utils/supabase/middleware";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  console.log("[Middleware] Path:", pathname);

  // ✅ Skip BotID challenge scripts & assets
  if (
    pathname.startsWith("/__botid") ||
    pathname.includes("/a-4-a/") ||
    (pathname.endsWith(".js") && pathname.includes("__botid"))
  ) {
    return NextResponse.next();
  }

  // Everything else goes through Supabase session
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    "/((?!api|_next/static|_next/image|favicon.ico|manifest|__botid|a-4-a|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
