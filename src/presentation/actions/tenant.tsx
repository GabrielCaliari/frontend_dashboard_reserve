"use server";

import { listMyTenantsService } from "@/src/modules/access-management/infrastructure/adapters";

export async function listMyTenants() {
  return listMyTenantsService();
}
