import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(req) {
  const { pathname } = req.nextUrl;

  // Get JWT token
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  });

  /* -----------------------------
     PUBLIC ROUTES (no auth)
  ------------------------------ */
  if (
    pathname.startsWith("/login") ||
    pathname.startsWith("/register") ||
    pathname === "/"
  ) {
    return NextResponse.next();
  }

  /* -----------------------------
     PROTECTED ROUTES
  ------------------------------ */
  if (!token) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  /* -----------------------------
     ROLE-BASED ACCESS
  ------------------------------ */

  // Provider dashboard
  if (
    pathname.startsWith("/dashboard/provider") &&
    token.role !== "provider"
  ) {
    return NextResponse.redirect(new URL("/unauthorized", req.url));
  }

  // User dashboard
  if (
    pathname.startsWith("/dashboard/user") &&
    token.role !== "user"
  ) {
    return NextResponse.redirect(new URL("/unauthorized", req.url));
  }

  // Admin routes (future-ready)
  if (
    pathname.startsWith("/dashboard/admin") &&
    token.role !== "admin"
  ) {
    return NextResponse.redirect(new URL("/unauthorized", req.url));
  }

  return NextResponse.next();
}

/* -----------------------------
   APPLY MIDDLEWARE TO ROUTES
------------------------------ */
export const config = {
  matcher: [
    "/dashboard/:path*",
  ],
};
