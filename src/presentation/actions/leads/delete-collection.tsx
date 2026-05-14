"use server";

import { deleteCollectionService } from "@/src/modules/leads/infrastructure/adapters";

export async function deleteCollectionAction(id: string): Promise<void> {
  try {
    await deleteCollectionService(id);
  } catch (error: any) {
    console.error("Error deleting collection:", error);
    throw new Error(
      error?.response?.data?.message || "Failed to delete collection",
    );
  }
}
