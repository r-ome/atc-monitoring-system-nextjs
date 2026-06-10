import { formatNumberToCurrency } from "@/app/lib/utils";

export type ExpenseUpdateActivityDescription = {
  title: string;
  changes: { field: string; before: string; after: string }[];
};

export function parseExpenseUpdateActivityDescription(
  description: string,
): ExpenseUpdateActivityDescription | null {
  const match = description.match(/^(Updated expense \(.+?\)) — ([\s\S]+)$/);
  if (!match) {
    return null;
  }

  const [, title, rest] = match;
  const changes = rest
    .split(" | ")
    .map((part) => {
      const sep = part.indexOf(": ");
      if (sep === -1) {
        return null;
      }
      const field = part.slice(0, sep).trim();
      const value = part.slice(sep + 2);
      const arrow = value.indexOf(" → ");
      if (arrow === -1) {
        return { field, before: value.trim(), after: "" };
      }
      return {
        field,
        before: value.slice(0, arrow).trim(),
        after: value.slice(arrow + 3).trim(),
      };
    })
    .filter(
      (change): change is ExpenseUpdateActivityDescription["changes"][number] =>
        Boolean(change),
    );

  if (!changes.length) {
    return null;
  }

  return { title, changes };
}

export function formatExpenseChangeValue(field: string, value: string): string {
  const trimmed = value.trim();

  if (!trimmed) {
    return value;
  }

  if (field === "Amount") {
    const numeric = Number(value.replace(/[^0-9.-]/g, ""));
    return Number.isFinite(numeric) ? formatNumberToCurrency(numeric) : value;
  }

  if (field === "Type" && /^[A-Z][A-Z_]+$/.test(trimmed)) {
    return trimmed
      .toLowerCase()
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }

  return value;
}

export function formatPlainExpenseDescription(description: string): string {
  return description.replace(
    /^(Added expense )₱(\d+(?:\.\d+)?)/,
    (_match, prefix, amount) => `${prefix}${formatNumberToCurrency(amount)}`,
  );
}
