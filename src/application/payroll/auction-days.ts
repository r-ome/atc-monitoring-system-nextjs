import prisma from "@/app/lib/prisma/prisma";

export async function getAuctionDatesForPeriod(
  branch_id: string,
  period_start: Date,
  period_end: Date,
): Promise<string[]> {
  // auction_date lives on auctions_inventories; we go through the auctions
  // table to filter by branch.
  const rows = await prisma.auctions_inventories.findMany({
    where: {
      auction_date: { gte: period_start, lte: period_end },
      auction_bidder: { auctions: { branch_id } },
    },
    select: { auction_date: true },
    distinct: ["auction_date"],
  });
  const set = new Set<string>();
  for (const r of rows) {
    set.add(toIsoDate(r.auction_date));
  }
  return Array.from(set).sort();
}

export function toIsoDate(d: Date): string {
  return new Date(d).toISOString().split("T")[0];
}

export function listDatesInRange(start: Date, end: Date): string[] {
  const out: string[] = [];
  const cur = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate()));
  const endDay = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate()));
  while (cur.getTime() <= endDay.getTime()) {
    out.push(cur.toISOString().split("T")[0]);
    cur.setUTCDate(cur.getUTCDate() + 1);
  }
  return out;
}
