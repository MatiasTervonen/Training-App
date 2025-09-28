import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/utils/supabase/middleware";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow BotID challenge requests to bypass Supabase session middleware
  if (
    pathname.startsWith("/__botid") ||
    pathname.includes("/a-4-a/") ||
    pathname === "/mfc" ||
    pathname === "/tl"
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
     * - api routes
     * - botid (BotID challenge and related files)
     * - a-4-a (BotID verification files)
     * - mfc (BotID verification files)
     * Feel free to modify this pattern to include more paths.
     */
    "/((?!api|_next/static|_next/image|favicon.ico|manifest|__botid|a-4-a|mfc|tl|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
