"use server";

import listSmtpServersServices from "../../services/smtp-server/list-smtp-servers-services";

export default async function listSmtpServers() {
  const response = await listSmtpServersServices();

  if (response?.error) {
    return response;
  }

  return response;
}
