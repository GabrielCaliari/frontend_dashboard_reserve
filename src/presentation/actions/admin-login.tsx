"use server";

import { cookies } from "next/headers";
import { adminLoginService } from "@/src/modules/access-management/infrastructure/adapters";
import { LoginCredentials, AuthResponse } from "@/src/shared/domain/types/@auth";
import { redirect } from "next/navigation";
import { errorTypes } from "@/src/infraestructure/axios/error-types";

interface ActionResult {
  success: boolean;
  data?: AuthResponse;
  error?: string;
}

export async function adminLogin({
  email,
  password,
}: LoginCredentials): Promise<ActionResult> {
  const result = await adminLoginService({
    email,
    password,
  });

  // Check if result is an AuthResponse (has session_token)
  if (result && typeof result === "object" && "session_token" in result) {
    const authResponse = result as AuthResponse;
    const cookieStore = await cookies();

    // Set all cookies server-side with proper configuration
    cookieStore.set("token", authResponse.session_token, {
      maxAge: 60 * 60 * 24, // 24 hours
      httpOnly: false, // Needed for client-side interceptor to set Authorization header
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });

    cookieStore.set("session-code", String(authResponse.session_id), {
      maxAge: 60 * 60 * 24,
      httpOnly: false, // Needed for client-side interceptor
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });

    cookieStore.set("session-name", authResponse.details.name, {
      maxAge: 60 * 60 * 24,
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });

    cookieStore.set("session-email", authResponse.details.email, {
      maxAge: 60 * 60 * 24,
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });

    cookieStore.set("session-role", authResponse.details.role, {
      maxAge: 60 * 60 * 24,
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });

    // Return success response with data but let the redirect happen
    // Wait for cookies to be set before redirecting
    if (authResponse.details.role === "super_admin") {
      redirect("/dashboard/global");
    } else {
      redirect("/dashboard");
    }
    // unreachable
    return { success: true, data: authResponse };
  }

  // Handle error response (error code string)
  return { success: false, error: result as string };
}
