import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const brlFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "BRL",
  minimumFractionDigits: 2
});

export function formatCurrency(value: number | undefined) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return brlFormatter.format(0);
  }
  return brlFormatter.format(value);
}
