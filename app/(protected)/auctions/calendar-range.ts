import { addMonths, endOfMonth, format, startOfMonth } from "date-fns";

function monthKey(date: Date) {
  return format(date, "yyyy-MM");
}

function listMonthKeys(start: Date, end: Date) {
  const keys: string[] = [];
  let cursor = startOfMonth(start);
  const last = startOfMonth(end);

  while (cursor <= last) {
    keys.push(monthKey(cursor));
    cursor = addMonths(cursor, 1);
  }

  return keys;
}

export function getFullMonthFetchRange(start: Date, end: Date) {
  const fetchStart = startOfMonth(start);
  const fetchEnd = endOfMonth(end);

  return {
    fetchStart,
    fetchEnd,
    monthKeys: listMonthKeys(fetchStart, fetchEnd),
  };
}
