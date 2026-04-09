"use server";

import { createCheckoutSessionService } from "@/src/common/services/payments/subscriptions-service";
import type {
  CreateCheckoutSessionDto,
  CheckoutSessionResponse,
} from "@/src/common/@types/@payments";

export async function createCheckoutSessionAction(
  data: CreateCheckoutSessionDto,
): Promise<CheckoutSessionResponse> {
  try {
    return await createCheckoutSessionService(data);
  } catch (error: any) {
    console.error("Error creating checkout session:", error);
    throw new Error(
      error?.response?.data?.message || "Failed to create checkout session",
    );
  }
}
