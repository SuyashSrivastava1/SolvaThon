import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const host = request.headers.get("host") || request.nextUrl.hostname || "";
  const isTimerSubdomain = host.startsWith("timer.") || host.startsWith("timer-");

  // 1. Subdomain Rewrite for timer.solvathon26.co.in
  if (isTimerSubdomain) {
    if (pathname === "/" || pathname === "") {
      const timerUrl = new URL("/timer", request.url);
      return NextResponse.rewrite(timerUrl);
    }
  }

  const authToken = request.cookies.get("auth_token")?.value;

  // 2. Edge-Level Protected Route Verification (HIGH-02)
  if (pathname.startsWith("/admin")) {
    if (!authToken) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  if (pathname.startsWith("/profile")) {
    if (!authToken) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  const response = NextResponse.next();

  // 3. Add defensive HTTP Security Headers (MED-04)
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), payment=()"
  );

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|favicon.svg).*)",
  ],
};
