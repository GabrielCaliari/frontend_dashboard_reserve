"use client";

import { getCookie } from "cookies-next";
import { AdminRole } from "@/src/shared/domain/types/@access-management";

export interface CurrentAdmin {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
}

/**
 * Returns the currently logged-in admin data from session cookies.
 * Replaces the broken `currentAdminId = 1` hardcoded pattern.
 */
export function useCurrentAdmin(): CurrentAdmin {
  const id = (getCookie("session-code") as string) || "";
  const name = (getCookie("session-name") as string) || "";
  const email = (getCookie("session-email") as string) || "";
  const role = (getCookie("session-role") as AdminRole) || AdminRole.viewer;

  return { id, name, email, role };
}
