import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const formatNumberPadding = (
  num: number | string,
  padding: number = 3
): string => num?.toString().padStart(padding, "0");

export const formatNumberToCurrency = (num: string | number): string => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 2,
  }).format(Number(num));
};

export const isRange = (value: any): value is Range => {
  return (
    value &&
    typeof value === "object" &&
    "start" in value &&
    "end" in value &&
    value.start instanceof Date &&
    value.end instanceof Date
  );
};
