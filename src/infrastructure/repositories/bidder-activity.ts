import type prisma from "@/app/lib/prisma/prisma";
import { SUPER_ADMIN_BRANCH } from "@/app/lib/prisma/prisma";
import { RequestContext } from "@/app/lib/prisma/RequestContext";
import { Prisma } from "@prisma/client";
import { buildTenantWhere } from "@/app/lib/prisma/tenant-where";
import { ATC_DEFAULT_BIDDER_NUMBER } from "src/entities/models/Bidder";
import { getBidderActivityCutoff, getBidderActivityTime } from "src/entities/models/BidderActivity";
import { InputParseError, NotFoundError } from "src/entities/errors/common";
import { parseInventoryHistoryRemark } from "src/entities/models/InventoryHistoryRemark";

export type BidderActivityTransaction = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

/** Explicit business-operation scope, never a global Prisma write hook. */
export type BidderActivityScope = {
  bidderIds?: string[];
  registrationIds?: string[];
  itemIds?: string[];
  inventoryIds?: string[];
  containerIds?: string[];
  receiptIds?: string[];
  paymentIds?: string[];
  requirementIds?: string[];
  banIds?: string[];
  manifestIds?: string[];
  counterCheckIds?: string[];
  historyItemIds?: string[];
  auctionNumbers?: { auction_id: string; bidder_number: string }[];
};

const unique = (ids: (string | null | undefined)[]) => [...new Set(ids.filter(
  (id): id is string => Boolean(id),
))].sort();

export async function resolveActivityBidders(tx: BidderActivityTransaction, scope: BidderActivityScope): Promise<string[]> {
  const ids = new Set<string>();
  if (scope.bidderIds?.length || scope.requirementIds?.length || scope.banIds?.length) {
    const conditions: Prisma.biddersWhereInput[] = [];
    if (scope.bidderIds?.length) conditions.push({ bidder_id: { in: unique(scope.bidderIds) } });
    if (scope.requirementIds?.length) conditions.push({ requirements: { some: { requirement_id: { in: scope.requirementIds } } } });
    if (scope.banIds?.length) conditions.push({ ban_histories: { some: { bidder_ban_history_id: { in: scope.banIds } } } });
    const bidders = await tx.bidders.findMany({
      where: buildTenantWhere("bidders", { OR: conditions }),
      select: { bidder_id: true },
    });
    bidders.forEach((bidder) => ids.add(bidder.bidder_id));
  }

  const numbers = [...(scope.auctionNumbers ?? [])];
  if (scope.inventoryIds?.length || scope.containerIds?.length) {
    const conditions: Prisma.inventoriesWhereInput[] = [];
    if (scope.inventoryIds?.length) conditions.push({ inventory_id: { in: unique(scope.inventoryIds) } });
    if (scope.containerIds?.length) conditions.push({ container_id: { in: unique(scope.containerIds) } });
    const rows = await tx.inventories.findMany({
      where: buildTenantWhere("inventories", { OR: conditions }),
      select: { auctions_inventory: { select: { auction_bidder: { select: { bidder_id: true } } } } },
    });
    rows.forEach((row) => { if (row.auctions_inventory) ids.add(row.auctions_inventory.auction_bidder.bidder_id); });
  }
  if (scope.historyItemIds?.length) {
    // Refund/cancellation corrections belong to the original bidder, even if
    // the item now belongs to ATC. Prefer receipt identity over remark parsing.
    const rows = await tx.inventory_histories.findMany({
      where: {
        auction_inventory_id: { in: unique(scope.historyItemIds) },
        auction_status: { in: ["CANCELLED", "REFUNDED"] },
        auction_inventory: buildTenantWhere("auctions_inventories", {}),
      },
      orderBy: [{ created_at: "desc" }, { inventory_history_id: "desc" }],
      distinct: ["auction_inventory_id"],
      select: {
        remarks: true,
        receipt: { select: { auction_bidder: { select: { bidder_id: true } } } },
        auction_inventory: { select: { auction_bidder: { select: { auction_id: true } } } },
      },
    });
    rows.forEach((row) => {
      if (row.receipt) ids.add(row.receipt.auction_bidder.bidder_id);
      else {
        const originalNumber = parseInventoryHistoryRemark(row.remarks ?? "").bidder_number;
        if (originalNumber && row.auction_inventory) numbers.push({
          auction_id: row.auction_inventory.auction_bidder.auction_id, bidder_number: originalNumber,
        });
      }
    });
  }
  if (scope.manifestIds?.length) {
    const rows = await tx.manifest_records.findMany({
      where: buildTenantWhere("manifest_records", {
        manifest_id: { in: scope.manifestIds }, OR: [{ error_message: null }, { error_message: "" }],
      }),
      select: { auction_id: true, bidder_number: true },
    });
    rows.forEach((row) => { if (row.bidder_number) numbers.push({ auction_id: row.auction_id, bidder_number: row.bidder_number }); });
  }
  if (scope.counterCheckIds?.length) {
    const rows = await tx.counter_check.findMany({
      where: { counter_check_id: { in: scope.counterCheckIds }, auction: buildTenantWhere("auctions", {}), OR: [{ error: null }, { error: "" }] },
      select: { auction_id: true, bidder_number: true },
    });
    rows.forEach((row) => { if (row.bidder_number) numbers.push({ auction_id: row.auction_id, bidder_number: row.bidder_number }); });
  }

  const registrations: Prisma.auctions_biddersWhereInput[] = [];
  if (scope.registrationIds?.length) registrations.push({ auction_bidder_id: { in: unique(scope.registrationIds) } });
  if (scope.itemIds?.length) registrations.push({ auctions_inventories: { some: { auction_inventory_id: { in: unique(scope.itemIds) } } } });
  if (scope.receiptIds?.length) registrations.push({ receipt_records: { some: { receipt_id: { in: unique(scope.receiptIds) } } } });
  if (scope.paymentIds?.length) registrations.push({ receipt_records: { some: { payments: { some: { payment_id: { in: unique(scope.paymentIds) } } } } } });
  const seenNumbers = new Set<string>();
  for (const row of numbers) {
    const number = row.bidder_number.trim();
    const normalized = number.padStart(4, "0");
    const key = `${row.auction_id}:${normalized}`;
    if (number.length > 0 && number.length <= 191 && !seenNumbers.has(key)) {
      seenNumbers.add(key);
      registrations.push({ auction_id: row.auction_id, bidder: { bidder_number: normalized } });
    }
  }
  if (registrations.length) {
    const rows = await tx.auctions_bidders.findMany({
      where: buildTenantWhere("auctions_bidders", { OR: registrations }),
      select: { bidder_id: true },
    });
    rows.forEach((row) => ids.add(row.bidder_id));
  }
  return [...ids].sort();
}

export async function touchBidderActivity(tx: Pick<Prisma.TransactionClient, "$executeRaw">, bidderIds: string[], now = new Date()) {
  const timestamp = getBidderActivityTime(now);
  const ids = unique(bidderIds);
  for (let offset = 0; offset < ids.length; offset += 500) {
    // IDs come from authorized, explicitly tenant-scoped reads above. Raw SQL
    // avoids injecting the old branch again after an authorized branch move.
    // CASE preserves a concurrent ban; GREATEST prevents timestamp regression.
    await tx.$executeRaw(Prisma.sql`
      UPDATE bidders FORCE INDEX (PRIMARY)
      SET last_activity_at = GREATEST(COALESCE(last_activity_at, created_at), ${timestamp}),
        status = CASE WHEN status = 'INACTIVE' THEN 'ACTIVE' ELSE status END
      WHERE bidder_id IN (${Prisma.join(ids.slice(offset, offset + 500))})
        AND deleted_at IS NULL AND bidder_number <> ${ATC_DEFAULT_BIDDER_NUMBER}
      ORDER BY bidder_id
    `);
  }
}

type ActivityTransactionOptions = { maxWait?: number; timeout?: number; isolationLevel?: Prisma.TransactionIsolationLevel };

/** Record before deletion/reassignment and after newly created relationships. All writes roll back together. */
export async function withBidderActivity<T>(
  client: Pick<typeof prisma, "$transaction">,
  scope: BidderActivityScope,
  operation: (tx: BidderActivityTransaction) => Promise<T>,
  options?: ActivityTransactionOptions,
): Promise<T> {
  for (let attempt = 0; ; attempt += 1) {
    try {
      return await client.$transaction(async (tx) => {
        const directIds = unique(scope.bidderIds ?? []);
        if (directIds.length) {
          const branchId = RequestContext.getStore()?.branch_id;
          // A locking read checks current ownership, not a repeatable-read
          // snapshot. This closes a branch-move race before direct bidder edits.
          const locked = await tx.$queryRaw<{ bidder_id: string }[]>(Prisma.sql`
            SELECT bidder_id FROM bidders WHERE bidder_id IN (${Prisma.join(directIds)})
              ${branchId && branchId !== SUPER_ADMIN_BRANCH ? Prisma.sql`AND branch_id = ${branchId}` : Prisma.empty}
            ORDER BY bidder_id FOR UPDATE
          `);
          if (locked.length !== directIds.length) throw new NotFoundError("Bidder not found in this branch.");
        }
        const before = await resolveActivityBidders(tx, scope);
        if (unique(scope.bidderIds ?? []).some((id) => !before.includes(id))) {
          throw new NotFoundError("Bidder not found in this branch.");
        }
        await touchBidderActivity(tx, before);
        const result = await operation(tx);
        const after = await resolveActivityBidders(tx, scope);
        await touchBidderActivity(tx, after.filter((id) => !before.includes(id)));
        return result;
      }, options);
    } catch (error) {
      const retryable = error instanceof Prisma.PrismaClientKnownRequestError && (
        error.code === "P2034" || (error.code === "P2010" && ["1213", "1205"].includes(String(error.meta?.code)))
      );
      if (!retryable || attempt >= 2) throw error;
    }
  }
}

export function isBidderActivityRecalculationEnabled() {
  return process.env.BIDDER_ACTIVITY_RECALCULATION_ENABLED === "true";
}

export async function recalculateBidderActivity(tx: BidderActivityTransaction, branchId: string, now = new Date()) {
  if (!branchId?.trim() || branchId === SUPER_ADMIN_BRANCH) throw new InputParseError("Select a valid auction branch.");
  const cutoff = getBidderActivityCutoff(now);
  const where: Prisma.biddersWhereInput = {
    branch_id: branchId, deleted_at: null,
    bidder_number: { not: ATC_DEFAULT_BIDDER_NUMBER }, status: { in: ["ACTIVE", "INACTIVE"] },
  };
  const unready = await tx.bidders.findFirst({
    where: { ...where, OR: [{ last_activity_at: null }, { last_activity_at: { gt: now } }] },
    select: { bidder_id: true },
  });
  if (unready) throw new InputParseError("Bidder activity records need review. Contact an administrator before starting this auction.");
  const updatedAt = getBidderActivityTime(now);
  // MySQL can otherwise choose a full table scan even when the composite index
  // exists. Keep the online classification scan on branch/status/activity keys.
  const inactive = await tx.$executeRaw(Prisma.sql`
    UPDATE bidders FORCE INDEX (bidders_branch_status_activity_idx)
    SET status = 'INACTIVE', updated_at = ${updatedAt}
    WHERE branch_id = ${branchId} AND status = 'ACTIVE' AND last_activity_at <= ${cutoff}
      AND deleted_at IS NULL AND bidder_number <> ${ATC_DEFAULT_BIDDER_NUMBER}
  `);
  const active = await tx.$executeRaw(Prisma.sql`
    UPDATE bidders FORCE INDEX (bidders_branch_status_activity_idx)
    SET status = 'ACTIVE', updated_at = ${updatedAt}
    WHERE branch_id = ${branchId} AND status = 'INACTIVE' AND last_activity_at > ${cutoff}
      AND deleted_at IS NULL AND bidder_number <> ${ATC_DEFAULT_BIDDER_NUMBER}
  `);
  return { activated: active, deactivated: inactive, cutoff: cutoff.toISOString() };
}
