import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string) {
  return new Date(date).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

export function getEnumLabel(enumObject: { [key: string]: number | string }, value: number | string): string {
  const enumKey = Object.keys(enumObject).find(key => enumObject[key] === value);
  return enumKey || '';
} 