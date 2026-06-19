import { NextRequest, NextResponse } from "next/server";
import { resolvePortalRedirect } from "@/src/modules/portal/domain/resolve-portal-redirect";

export async function proxy(request: NextRequest) {
  const token = request.cookies.get("token")?.value;

  if (request.nextUrl.pathname.startsWith("/")) {
    if (!token && request.nextUrl.pathname === "/") {
      return NextResponse.redirect(new URL("/auth/login", request.url));
    }
    if (token && request.nextUrl.pathname === "/") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    if (token && request.nextUrl.pathname === "/auth/login") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }
  if (request.nextUrl.pathname.startsWith("/dashboard")) {
    if (!token) {
      return NextResponse.redirect(new URL("/auth/login", request.url));
    }
  }
  if (request.nextUrl.pathname.startsWith("/portal")) {
    const portalToken = request.cookies.get("portal-token")?.value;
    const redirectTo = resolvePortalRedirect(request.nextUrl.pathname, Boolean(portalToken));
    if (redirectTo) {
      return NextResponse.redirect(new URL(redirectTo, request.url));
    }
  }
  return NextResponse.next();
}
