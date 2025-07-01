import { type ClassValue } from "clsx";
import { clsx as clsxImpl } from "clsx";
import { twMerge } from "tailwind-merge"; // eslint-disable-line no-restricted-imports

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsxImpl(inputs));
}

export function clsx(...inputs: ClassValue[]): string {
  return clsxImpl(inputs);
}
