"use server";

import { listMyTenantsService } from "@/src/common/services/tenant";

export async function listMyTenants() {
  return listMyTenantsService();
}
