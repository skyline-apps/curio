import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge"; // eslint-disable-line no-restricted-imports

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
