import { formatNumberPadding } from "./utils";

const escapeRegExp = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const normalizeContainerInventoryBarcode = (
  barcode: string,
  containerBarcode: string,
) => {
  const trimmed = barcode.trim();
  if (!trimmed) return "";

  const prefix = `${containerBarcode}-`;
  if (!trimmed.startsWith(prefix)) return trimmed;

  const suffix = trimmed.slice(prefix.length);
  if (!/^\d+$/.test(suffix)) return trimmed;

  return `${containerBarcode}-${formatNumberPadding(suffix, 3)}`;
};

export const validateContainerInventoryBarcode = (
  barcode: string,
  containerBarcode: string,
) => {
  const normalizedBarcode = normalizeContainerInventoryBarcode(
    barcode,
    containerBarcode,
  );
  const containerPattern = escapeRegExp(containerBarcode);
  const valid =
    normalizedBarcode === containerBarcode ||
    new RegExp(`^${containerPattern}-\\d+$`).test(normalizedBarcode);

  if (valid) {
    return { isValid: true as const, barcode: normalizedBarcode };
  }

  return {
    isValid: false as const,
    barcode: normalizedBarcode,
    error: `Barcode must be ${containerBarcode} or ${containerBarcode}-###.`,
  };
};
