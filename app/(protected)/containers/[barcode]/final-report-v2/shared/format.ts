export const peso = (n: number | null | undefined): string => {
  if (n == null || Number.isNaN(n)) return "—";
  return `₱${n.toLocaleString(undefined, { minimumFractionDigits: 0 })}`;
};

export const formatAuctionRange = (dates: string[]): string => {
  if (dates.length === 0) return "—";
  const sorted = [...dates].sort();
  const start = new Date(sorted[0]);
  const end = new Date(sorted[sorted.length - 1]);
  const sameDay = sorted[0] === sorted[sorted.length - 1];
  const month = (d: Date) => d.toLocaleString("en-US", { month: "short" });
  const day = (d: Date) => d.getDate();
  const year = end.getFullYear();
  if (sameDay) return `${month(start)} ${day(start)}, ${year}`;
  if (start.getMonth() === end.getMonth())
    return `${month(start)} ${day(start)} – ${day(end)}, ${year}`;
  return `${month(start)} ${day(start)} – ${month(end)} ${day(end)}, ${year}`;
};

export const daysFromToday = (target: Date): number => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const t = new Date(target);
  t.setHours(0, 0, 0, 0);
  return Math.round((t.getTime() - today.getTime()) / 86400000);
};
