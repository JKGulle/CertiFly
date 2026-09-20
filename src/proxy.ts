import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/session";

// Gates the whole /generate console and its backing /api/admin endpoints
// behind a login. Only reads the signed cookie (no DB call) — see
// "Optimistic checks with Proxy" in the Next.js auth guide.
export function proxy(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const session = verifySessionToken(token);
  const { pathname } = request.nextUrl;

  if (pathname === "/login") {
    if (session) {
      return NextResponse.redirect(new URL("/generate/dashboard", request.url));
    }
    return NextResponse.next();
  }

  if (pathname === "/") {
    return NextResponse.redirect(
      new URL(session ? "/generate/dashboard" : "/login", request.url)
    );
  }

  if (pathname.startsWith("/api/admin")) {
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.next();
  }

  if (!session) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/generate/:path*", "/api/admin/:path*", "/login"],
};
