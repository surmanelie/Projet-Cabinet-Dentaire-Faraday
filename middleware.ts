import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { canAccessRoute, defaultRouteForRole } from "@/lib/permissions";
import type { SessionUser } from "@/types";

const SESSION_COOKIE = "faradayboard_session";
const secret = new TextEncoder().encode(
  process.env.SESSION_SECRET ?? "dev-secret-non-securise-a-changer"
);

const PUBLIC_PATHS = ["/login", "/api/auth/login", "/activer-compte", "/pointer"];

/**
 * Protection des routes côté serveur : aucune page ne doit être accessible
 * sans session valide, et chaque rôle ne voit que ce qui lui est autorisé
 * (cf. lib/permissions.ts -> ROUTE_ACCESS). Cette vérification est en plus
 * des contrôles faits dans chaque page/action — défense en profondeur.
 */
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (
    PUBLIC_PATHS.some((p) => pathname.startsWith(p)) ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/manifest")
  ) {
    return NextResponse.next();
  }

  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) {
    const loginUrl = new URL("/login", req.url);
    if (pathname !== "/") loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  try {
    const { payload } = await jwtVerify(token, secret);
    const user = payload.user as SessionUser;

    if (pathname === "/") {
      return NextResponse.redirect(new URL(defaultRouteForRole(user.role), req.url));
    }

    if (!canAccessRoute(pathname, user.role)) {
      return NextResponse.redirect(new URL(defaultRouteForRole(user.role), req.url));
    }

    return NextResponse.next();
  } catch {
    return NextResponse.redirect(new URL("/login", req.url));
  }
}

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico).*)"],
};
