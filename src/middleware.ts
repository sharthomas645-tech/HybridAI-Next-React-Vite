import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth";

const PROTECTED_ROUTES = ["/dashboard", "/upload"];
const PUBLIC_ROUTES = ["/", "/auth/callback"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtected = PROTECTED_ROUTES.some((route) =>
    pathname.startsWith(route)
  );
  const isPublic = PUBLIC_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(route)
  );

  if (!isProtected && !isPublic) return NextResponse.next();

  const sessionCookie = request.cookies.get(SESSION_COOKIE)?.value;
  let isAuthenticated = false;

  if (sessionCookie) {
    try {
      const session = JSON.parse(sessionCookie) as { expiresAt: number };
      isAuthenticated = Date.now() < session.expiresAt;
    } catch {
      isAuthenticated = false;
    }
  }

  if (isProtected && !isAuthenticated) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (pathname === "/" && isAuthenticated) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/dashboard/:path*", "/upload/:path*", "/auth/callback"],
};
