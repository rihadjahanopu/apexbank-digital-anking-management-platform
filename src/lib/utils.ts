import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combines class names with Tailwind Merge for conflict-free utility classes.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Formats a Date object or ISO string to a human-readable date and time.
 */
export function formatDateTime(date: Date | string | number): string {
  const d = new Date(date);
  if (isNaN(d.getTime())) return "N/A";
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(d);
}

/**
 * Formats a Date object or ISO string to short date (e.g., Nov 21, 2026).
 */
export function formatDate(date: Date | string | number): string {
  const d = new Date(date);
  if (isNaN(d.getTime())) return "N/A";
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(d);
}

/**
 * Masks an account number showing only the last 4 digits (e.g. •••• 4821).
 */
export function maskAccountNumber(accNum: string): string {
  if (!accNum || accNum.length < 4) return accNum || "••••";
  const last4 = accNum.slice(-4);
  return `•••• ${last4}`;
}

/**
 * Truncates a string to a given max length with ellipsis.
 */
export function truncate(text: string, length = 20): string {
  if (!text) return "";
  if (text.length <= length) return text;
  return text.substring(0, length) + "...";
}
