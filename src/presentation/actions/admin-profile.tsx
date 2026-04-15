"use server";

import { getAdminProfileService } from "@/src/common/services/admin-profile";

export async function getAdminProfile() {
  return getAdminProfileService();
}
