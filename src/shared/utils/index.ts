export const removeSpecialCharacters = (value: string) =>
  value.replace(/[^\d]/g, "");
import { EOriginLead } from "@/src/shared/domain/types/@lead";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const maskCPF = (value: string) => {
  return value
    .replace(/\D/g, "")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
};

export const maskPhone = (value: string) => {
  return value
    .replace(/\D/g, "")
    .replace(/(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d)/, "$1-$2")
    .replace(/(\d{5})(\d{1,4})$/, "$1-$2");
};

export function capitalizeFirstLetter(val: string) {
  return String(val).charAt(0).toUpperCase() + String(val).slice(1);
}

export function converterDataISOparaBR(dataISO: string) {
  const data = new Date(dataISO);
  const dia = String(data.getDate()).padStart(2, "0");
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const ano = data.getFullYear();

  return `${dia}/${mes}/${ano}`;
}

export function maskParam(value: string) {
  const valorStr = String(value);
  const valorMascarado = Buffer.from(valorStr).toString("base64");
  return valorMascarado.substring(0, 8).padEnd(8, "0");
}

export function desmakParam(value: string) {
  const valorOriginal = Buffer.from(value, "base64").toString("utf-8");
  return valorOriginal;
}

export const applyCpfCnpjMask = (value: string) => {
  const cleanValue = value.replace(/\D/g, "");
  if (cleanValue.length <= 11) {
    return cleanValue
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  }
  return cleanValue
    .replace(/(\d{2})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1/$2")
    .replace(/(\d{4})(\d{1,2})$/, "$1-$2");
};

export const applyPhoneMask = (value: string) => {
  const cleanValue = value.replace(/\D/g, "");
  if (cleanValue.length <= 10) {
    return cleanValue.replace(/(\d{2})(\d{4})(\d{1,4})$/, "($1) $2-$3");
  }
  return cleanValue.replace(/(\d{2})(\d{5})(\d{1,4})$/, "($1) $2-$3");
};

export const validateCpfCnpj = (value: string) => {
  const cleanValue = value.replace(/\D/g, "");
  if (cleanValue.length === 11) return validateCpf(cleanValue);
  if (cleanValue.length === 14) return validateCnpj(cleanValue);
  return false;
};

export const validateCpf = (cpf: string) => {
  if (!cpf || cpf.length !== 11) return false;
  let sum = 0;
  for (let i = 1; i <= 9; i++)
    sum += parseInt(cpf.substring(i - 1, i)) * (11 - i);
  let remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cpf.substring(9, 10))) return false;

  sum = 0;
  for (let i = 1; i <= 10; i++)
    sum += parseInt(cpf.substring(i - 1, i)) * (12 - i);
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  return remainder === parseInt(cpf.substring(10, 11));
};

export const validateCnpj = (cnpj: string) => {
  if (!cnpj || cnpj.length !== 14) return false;
  let length = cnpj.length - 2;
  let numbers = cnpj.substring(0, length);
  const digits = cnpj.substring(length);
  let sum = 0;
  let pos = length - 7;

  for (let i = length; i >= 1; i--) {
    sum += parseInt(numbers.charAt(length - i)) * pos--;
    if (pos < 2) pos = 9;
  }
  let result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== parseInt(digits.charAt(0))) return false;

  length += 1;
  numbers = cnpj.substring(0, length);
  sum = 0;
  pos = length - 7;

  for (let i = length; i >= 1; i--) {
    sum += parseInt(numbers.charAt(length - i)) * pos--;
    if (pos < 2) pos = 9;
  }
  result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  return result === parseInt(digits.charAt(1));
};

export const removeAccents = (str: string) => {
  return str.normalize("NFD").replace(/[̀-ͯ]/g, "");
};

export function formatDateTimeToBRL(date: Date): string {
  return date.toLocaleString("pt-BR", {
    hour12: false, // Para usar o formato 24 horas
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function displayOrigin(origin: number) {
  switch (origin) {
    case EOriginLead.seo_tool:
      return "Ferramenta SEO";
    case EOriginLead.seo_archive:
      return "Arquivo SEO";
    case EOriginLead.email:
      return "Email";
    case EOriginLead.facebook_ads:
      return "Facebook Ads";
    case EOriginLead.google_ads:
      return "Google Ads";
    case EOriginLead.page:
      return "Página";
    default:
      return "Outro";
  }
}
