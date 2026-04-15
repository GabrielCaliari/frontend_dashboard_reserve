"use server";

import { listLeadsService } from "@/src/common/services/list-leads-service";

export const listLeads = async (page: number = 1) => {
  const result = await listLeadsService({ page });
  return result;
};
