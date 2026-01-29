import { clsx, type ClassValue } from "clsx";
import { AuctionDateRange } from "src/entities/models/Auction";
import { twMerge } from "tailwind-merge";
import { formatInTimeZone } from "date-fns-tz";
import type { SortingFn } from "@tanstack/react-table";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const formatNumberPadding = (
  num: number | string,
  padding: number = 3,
): string => num?.toString().padStart(padding, "0");

export const formatNumberToCurrency = (num: string | number): string => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 2,
  }).format(Number(num));
};

export const isRange = (value: Date | AuctionDateRange) => {
  return (
    value &&
    typeof value === "object" &&
    "start" in value &&
    "end" in value &&
    value.start instanceof Date &&
    value.end instanceof Date
  );
};

export const formatDate = (date: Date, format: string = "MMMM dd, yyyy") => {
  return formatInTimeZone(date, "Asia/Manila", format);
};

export function buildGroupIndexMap<T>(
  rows: T[],
  getGroupId: (row: T) => string | null | undefined,
  startIndex = 1,
): Record<string, number> {
  const map: Record<string, number> = {};
  let counter = startIndex;

  for (const row of rows) {
    const id = getGroupId(row);
    if (id && map[id] == null) {
      map[id] = counter++;
    }
  }

  return map;
}

export function createGroupSortingFn<TData, TValue>(
  getGroupId: (row: TData) => string,
  getSortValue: (row: TData) => TValue,
  compare: (a: TValue, b: TValue) => number,
): SortingFn<TData> {
  return (rowA, rowB) => {
    const a = rowA.original as TData;
    const b = rowB.original as TData;

    const groupA = getGroupId(a);
    const groupB = getGroupId(b);

    // same group → keep original relative order
    if (groupA === groupB) return 0;

    const valueA = getSortValue(a);
    const valueB = getSortValue(b);

    return compare(valueA, valueB); // TanStack flips sign for desc
  };
}

export function getItemPriceWithServiceChargeAmount(
  price: number,
  service_charge: number,
) {
  return price + (price * service_charge) / 100;
}
