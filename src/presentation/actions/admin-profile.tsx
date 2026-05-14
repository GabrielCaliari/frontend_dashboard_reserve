"use server";

import { getAdminProfileService } from "@/src/modules/access-management/infrastructure/adapters";

export async function getAdminProfile() {
  return getAdminProfileService();
}
