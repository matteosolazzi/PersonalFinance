import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number, compact = false): string {
  if (compact && Math.abs(value) >= 1000) {
    return new Intl.NumberFormat("it-IT", {
      style: "currency",
      currency: "EUR",
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(value);
  }
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatPercent(value: number): string {
  return new Intl.NumberFormat("it-IT", {
    style: "percent",
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value);
}

export function getCurrentQuarter(): { year: number; quarter: number } {
  const now = new Date();
  const month = now.getMonth() + 1;
  const quarter = Math.ceil(month / 3);
  return { year: now.getFullYear(), quarter };
}

export function getQuarterLabel(year: number, quarter: number): string {
  return `Q${quarter} ${year}`;
}

export function getQuarterEndDate(year: number, quarter: number): Date {
  const endMonths = [3, 6, 9, 12];
  const month = endMonths[quarter - 1];
  return new Date(year, month - 1 + 1, 0); // last day of end month
}

export function isNearQuarterEnd(daysThreshold = 5): boolean {
  const now = new Date();
  const { year, quarter } = getCurrentQuarter();
  const endDate = getQuarterEndDate(year, quarter);
  const diff = endDate.getTime() - now.getTime();
  const daysLeft = diff / (1000 * 60 * 60 * 24);
  return daysLeft <= daysThreshold && daysLeft >= 0;
}
