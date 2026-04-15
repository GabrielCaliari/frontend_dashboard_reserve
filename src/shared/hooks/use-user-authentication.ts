"use client";

import toast from "react-hot-toast";
import { LoginCredentials } from "@/src/shared/domain/types/@auth";
import { adminLogin } from "@/src/presentation/actions/admin-login";
import { errorTypes } from "@/src/infraestructure/axios/error-types";

export default function useAdminAuthentication() {
  const execAdminAuthentication = async ({
    email,
    password,
  }: LoginCredentials) => {
    try {
      const result = await adminLogin({
        email,
        password,
      });

      if (result.success) {
        return true;
      }

      // Handle error codes
      switch (result.error) {
        case errorTypes._401.admin_email_nf:
          toast.error("Não foi possível autenticar.");
          break;
        case errorTypes._401.admin_password_in:
          toast.error("Não foi possível autenticar.");
          break;
        default:
          toast.error("Ops... Deu erro.");
      }

      return false;
    } catch (error: any) {
      if (
        error?.message === "NEXT_REDIRECT" ||
        error?.digest?.startsWith("NEXT_REDIRECT")
      ) {
        throw error;
      }
      toast.error("Ops... Deu erro.");
      return false;
    }
  };

  return { execAdminAuthentication };
}
