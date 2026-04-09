type ActivityLogDiffField<T> = {
  label: string;
  getValue: (record: T) => unknown;
  formatValue?: (value: unknown) => string;
};

type BuildActivityLogDiffParams<T> = {
  previous: T;
  current: T;
  fields: ActivityLogDiffField<T>[];
};

function normalizeValue(value: unknown): string {
  if (value == null) {
    return "";
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (typeof value === "string") {
    return value.trim();
  }

  return String(value);
}

function toDisplayValue(value: unknown, formatValue?: (value: unknown) => string) {
  const normalized = normalizeValue(value);

  if (normalized === "") {
    return "N/A";
  }

  return formatValue ? formatValue(value) : normalized;
}

export function buildActivityLogDiff<T>({
  previous,
  current,
  fields,
}: BuildActivityLogDiffParams<T>): string {
  return fields
    .flatMap(({ label, getValue, formatValue }) => {
      const previousValue = getValue(previous);
      const currentValue = getValue(current);

      if (normalizeValue(previousValue) === normalizeValue(currentValue)) {
        return [];
      }

      return `${label}: ${toDisplayValue(previousValue, formatValue)} -> ${toDisplayValue(currentValue, formatValue)}`;
    })
    .join(" | ");
}
