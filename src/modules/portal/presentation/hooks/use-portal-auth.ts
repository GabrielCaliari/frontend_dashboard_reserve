"use client";

import { useCallback, useState } from "react";
import { getCookie, setCookie, deleteCookie } from "cookies-next";
import { useRouter } from "next/navigation";
import { portalAuthService } from "@/src/modules/portal/infrastructure/portal-auth-service";
import {
  ClientRole,
  type ClientLoginCredentials,
  type ClientProfile,
} from "@/src/modules/portal/domain/portal-auth";

const COOKIE_TOKEN = "portal-token";
const COOKIE_ROLE = "portal-session-role";
const COOKIE_NAME = "portal-session-name";
const COOKIE_EMAIL = "portal-session-email";
const COOKIE_TENANT = "portal-session-tenant";
const COOKIE_MAX_AGE = 60 * 60 * 24; // 24h, matches admin session convention

export function readPortalProfile(): ClientProfile | null {
  const role = getCookie(COOKIE_ROLE) as ClientRole | undefined;
  const name = getCookie(COOKIE_NAME) as string | undefined;
  const email = getCookie(COOKIE_EMAIL) as string | undefined;
  const tenantRaw = getCookie(COOKIE_TENANT) as string | undefined;
  if (!role || !name || !email || !tenantRaw) return null;

  try {
    return { role, name, email, tenant: JSON.parse(tenantRaw) };
  } catch {
    return null;
  }
}

export function usePortalAuth() {
  const router = useRouter();
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [profile, setProfile] = useState<ClientProfile | null>(() => readPortalProfile());

  const login = useCallback(
    async (credentials: ClientLoginCredentials) => {
      setIsLoggingIn(true);
      try {
        const response = await portalAuthService.login(credentials);
        const cookieOpts = { maxAge: COOKIE_MAX_AGE, path: "/" };
        setCookie(COOKIE_TOKEN, response.session_token, cookieOpts);
        setCookie(COOKIE_ROLE, response.details.role, cookieOpts);
        setCookie(COOKIE_NAME, response.details.name, cookieOpts);
        setCookie(COOKIE_EMAIL, response.details.email, cookieOpts);
        setCookie(COOKIE_TENANT, JSON.stringify(response.details.tenant), cookieOpts);
        setProfile({
          role: response.details.role,
          name: response.details.name,
          email: response.details.email,
          tenant: response.details.tenant,
        });
        router.push("/portal/dashboard");
      } finally {
        setIsLoggingIn(false);
      }
    },
    [router],
  );

  const logout = useCallback(() => {
    [COOKIE_TOKEN, COOKIE_ROLE, COOKIE_NAME, COOKIE_EMAIL, COOKIE_TENANT].forEach((name) =>
      deleteCookie(name, { path: "/" }),
    );
    setProfile(null);
    router.push("/portal/login");
  }, [router]);

  return { profile, isLoggingIn, login, logout };
}
