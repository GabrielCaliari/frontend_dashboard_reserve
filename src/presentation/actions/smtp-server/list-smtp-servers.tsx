"use server";

import { listSmtpServersServices } from "@/src/modules/mailer/infrastructure/adapters";

export default async function listSmtpServers() {
  const response = await listSmtpServersServices();

  if (response?.error) {
    return response;
  }

  return response;
}
