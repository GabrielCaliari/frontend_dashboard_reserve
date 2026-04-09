"use server";

import { getAdminProfileService } from "../services/admin-profile";

export async function getAdminProfile() {
  return getAdminProfileService();
}
