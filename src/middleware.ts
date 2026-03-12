import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow API routes and the login page through
  if (pathname.startsWith("/api/") || pathname === "/login") {
    return NextResponse.next();
  }

  // If no session cookie, redirect to login
  const session = request.cookies.get("zip_session");
  if (!session) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
