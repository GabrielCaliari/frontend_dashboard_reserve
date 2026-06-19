export function resolvePortalRedirect(
  pathname: string,
  hasPortalToken: boolean,
): string | null {
  if (!pathname.startsWith("/portal")) return null;

  const isLoginRoute = pathname === "/portal/login";

  if (!hasPortalToken && !isLoginRoute) return "/portal/login";
  if (hasPortalToken && isLoginRoute) return "/portal/dashboard";
  return null;
}
