"use server";

import { listLeadsLegacy } from "@/src/modules/leads/infrastructure/adapters";

// TODO(arquitetura): endpoint não existe em backend_reserve — ver
// src/modules/leads/infrastructure/ORPHANED-ENDPOINTS.md
export const listLeads = async (page: number = 1) => {
  const result = await listLeadsLegacy({ page });
  return result;
};
