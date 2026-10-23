import { Prisma, PrismaClient } from "@prisma/client";
import { ATC_DEFAULT_BIDDER_NUMBER } from "src/entities/models/Bidder";
import { getBidderActivityCutoff } from "src/entities/models/BidderActivity";

const INITIALIZATION_SELECT = {
  bidder_id: true,
  bidder_number: true,
  branch_id: true,
  status: true,
  created_at: true,
  updated_at: true,
  last_activity_at: true,
  branch: { select: { name: true } },
} satisfies Prisma.biddersSelect;

export type BidderActivityInitializationRow = Prisma.biddersGetPayload<{
  select: typeof INITIALIZATION_SELECT;
}>;

export type BidderActivityEvidence = {
  bidder_id: string;
  source: string;
  activity_at: Date;
};

export type BidderActivityCandidate = {
  bidder_id: string;
  branch_id: string;
  activity_at: Date;
  needs_initialization: boolean;
  would_activate: boolean;
  would_deactivate: boolean;
  future_activity: boolean;
};

export type BidderActivityInitializationOptions = {
  branch_id?: string;
  all_branches: boolean;
  apply: boolean;
  batch_size: number;
};

export type BidderActivityInitializationSummary = {
  branch_id: string;
  branch_name: string;
  eligible_bidders: number;
  needs_initialization: number;
  already_tracked: number;
  timestamps_initialized: number;
  would_activate: number;
  would_deactivate: number;
  future_activity: number;
};

/** Default to preview and require an explicit scope, including for reads. */
export function parseBidderActivityInitializationArgs(
  args: string[],
): BidderActivityInitializationOptions | null {
  if (args.length === 1 && args[0] === "--help") return null;

  const options: BidderActivityInitializationOptions = {
    all_branches: false, apply: false, batch_size: 200,
  };
  const seen = new Set<string>();

  for (let index = 0; index < args.length; index += 1) {
    const flag = args[index];
    if (seen.has(flag)) throw new Error(`Duplicate argument: ${flag}`);
    seen.add(flag);
    if (flag === "--apply") options.apply = true;
    else if (flag === "--all-branches") options.all_branches = true;
    else if (flag === "--branch-id" || flag === "--batch-size") {
      const value = args[++index];
      if (!value || value.startsWith("--")) {
        throw new Error(`Missing value for ${flag}`);
      }
      if (flag === "--branch-id") options.branch_id = value.trim();
      else options.batch_size = Number(value);
    } else throw new Error(`Unknown argument: ${flag}`);
  }

  validateInitializationOptions(options);
  return options;
}

function validateInitializationOptions(options: BidderActivityInitializationOptions) {
  if (Boolean(options.branch_id?.trim()) === options.all_branches) {
    throw new Error("Choose exactly one scope: --branch-id ID or --all-branches.");
  }
  if (!Number.isInteger(options.batch_size) || options.batch_size < 1 || options.batch_size > 1000) {
    throw new Error("Batch size must be an integer from 1 to 1000.");
  }
}

/** Aggregate retained evidence, rather than loading every related row into memory. */
export function buildBidderActivityEvidenceQuery(bidderIds: string[]): Prisma.Sql {
  if (!bidderIds.length) throw new Error("Evidence query requires bidder IDs.");
  const ids = Prisma.join(bidderIds);
  return Prisma.sql`
    SELECT r.bidder_id, 'registration' AS source,
      MAX(GREATEST(r.created_at, r.updated_at, COALESCE(r.deleted_at, r.created_at))) AS activity_at
    FROM auctions_bidders r WHERE r.bidder_id IN (${ids}) GROUP BY r.bidder_id
    UNION ALL
    SELECT r.bidder_id, 'requirement',
      MAX(GREATEST(r.created_at, r.updated_at, COALESCE(r.deleted_at, r.created_at)))
    FROM bidder_requirements r WHERE r.bidder_id IN (${ids}) GROUP BY r.bidder_id
    UNION ALL
    SELECT r.bidder_id, 'ban_history',
      MAX(GREATEST(r.created_at, r.updated_at, COALESCE(r.deleted_at, r.created_at)))
    FROM bidder_ban_histories r WHERE r.bidder_id IN (${ids}) GROUP BY r.bidder_id
    UNION ALL
    SELECT r.bidder_id, 'auction_item',
      MAX(GREATEST(i.created_at, i.updated_at, COALESCE(i.deleted_at, i.created_at)))
    FROM auctions_inventories i JOIN auctions_bidders r ON r.auction_bidder_id = i.auction_bidder_id
    WHERE r.bidder_id IN (${ids}) GROUP BY r.bidder_id
    UNION ALL
    SELECT r.bidder_id, 'inventory',
      MAX(GREATEST(i.created_at, i.updated_at, COALESCE(i.deleted_at, i.created_at)))
    FROM inventories i JOIN auctions_inventories a ON a.inventory_id = i.inventory_id
    JOIN auctions_bidders r ON r.auction_bidder_id = a.auction_bidder_id
    WHERE r.bidder_id IN (${ids}) GROUP BY r.bidder_id
    UNION ALL
    SELECT r.bidder_id, 'receipt',
      MAX(GREATEST(p.created_at, p.updated_at, COALESCE(p.deleted_at, p.created_at)))
    FROM receipt_records p JOIN auctions_bidders r ON r.auction_bidder_id = p.auction_bidder_id
    WHERE r.bidder_id IN (${ids}) GROUP BY r.bidder_id
    UNION ALL
    SELECT r.bidder_id, 'payment',
      MAX(GREATEST(p.created_at, p.updated_at, COALESCE(p.deleted_at, p.created_at)))
    FROM payments p JOIN receipt_records q ON q.receipt_id = p.receipt_id
    JOIN auctions_bidders r ON r.auction_bidder_id = q.auction_bidder_id
    WHERE r.bidder_id IN (${ids}) GROUP BY r.bidder_id
    UNION ALL
    SELECT r.bidder_id, 'item_history',
      MAX(GREATEST(h.created_at, h.updated_at, COALESCE(h.deleted_at, h.created_at)))
    FROM inventory_histories h JOIN auctions_inventories i ON i.auction_inventory_id = h.auction_inventory_id
    JOIN auctions_bidders r ON r.auction_bidder_id = i.auction_bidder_id
    WHERE r.bidder_id IN (${ids}) GROUP BY r.bidder_id
    UNION ALL
    SELECT r.bidder_id, 'receipt_history',
      MAX(GREATEST(h.created_at, h.updated_at, COALESCE(h.deleted_at, h.created_at)))
    FROM inventory_histories h JOIN receipt_records p ON p.receipt_id = h.receipt_id
    JOIN auctions_bidders r ON r.auction_bidder_id = p.auction_bidder_id
    WHERE r.bidder_id IN (${ids}) GROUP BY r.bidder_id
    UNION ALL
    SELECT r.bidder_id, 'inventory_history',
      MAX(GREATEST(h.created_at, h.updated_at, COALESCE(h.deleted_at, h.created_at)))
    FROM inventory_histories h JOIN auctions_inventories i ON i.inventory_id = h.inventory_id
    JOIN auctions_bidders r ON r.auction_bidder_id = i.auction_bidder_id
    WHERE h.auction_inventory_id IS NULL AND h.receipt_id IS NULL
      AND r.bidder_id IN (${ids}) GROUP BY r.bidder_id
    UNION ALL
    SELECT r.bidder_id, 'manifest',
      MAX(GREATEST(m.created_at, m.updated_at, COALESCE(m.deleted_at, m.created_at)))
    FROM manifest_records m JOIN auctions_bidders r ON r.auction_id = m.auction_id
    JOIN bidders b ON b.bidder_id = r.bidder_id
    WHERE r.bidder_id IN (${ids}) AND COALESCE(m.error_message, '') = ''
      AND CHAR_LENGTH(TRIM(m.bidder_number)) BETWEEN 1 AND 191
      AND b.bidder_number = LPAD(TRIM(m.bidder_number), GREATEST(4, CHAR_LENGTH(TRIM(m.bidder_number))), '0')
    GROUP BY r.bidder_id
    UNION ALL
    SELECT r.bidder_id, 'counter_check',
      MAX(GREATEST(c.created_at, c.updated_at, COALESCE(c.deleted_at, c.created_at)))
    FROM counter_check c JOIN auctions_bidders r ON r.auction_id = c.auction_id
    JOIN bidders b ON b.bidder_id = r.bidder_id
    WHERE r.bidder_id IN (${ids}) AND COALESCE(c.error, '') = ''
      AND CHAR_LENGTH(TRIM(c.bidder_number)) BETWEEN 1 AND 191
      AND b.bidder_number = LPAD(TRIM(c.bidder_number), GREATEST(4, CHAR_LENGTH(TRIM(c.bidder_number))), '0')
    GROUP BY r.bidder_id
  `;
}

export function planBidderActivityInitialization(
  bidders: BidderActivityInitializationRow[],
  evidence: BidderActivityEvidence[],
  now: Date,
): BidderActivityCandidate[] {
  const cutoff = getBidderActivityCutoff(now);
  const latest = new Map<string, Date>();
  for (const item of evidence) {
    if (!Number.isFinite(item.activity_at.getTime())) throw new Error("Invalid historical activity timestamp.");
    const previous = latest.get(item.bidder_id);
    if (!previous || item.activity_at > previous) latest.set(item.bidder_id, item.activity_at);
  }

  return bidders.map((bidder) => {
    // Once tracked, the dedicated field is authoritative. Re-reading updated_at
    // on later runs would turn automatic status changes into apparent activity.
    const activity = bidder.last_activity_at ?? new Date(Math.max(
      bidder.created_at.getTime(), bidder.updated_at.getTime(),
      latest.get(bidder.bidder_id)?.getTime() ?? 0,
    ));
    return {
      bidder_id: bidder.bidder_id,
      branch_id: bidder.branch_id,
      activity_at: activity,
      needs_initialization: bidder.last_activity_at === null,
      would_activate: bidder.status === "INACTIVE" && activity > cutoff,
      would_deactivate: bidder.status === "ACTIVE" && activity <= cutoff,
      future_activity: activity > now,
    };
  });
}

/** Raw SQL intentionally preserves updated_at and only fills still-null activity. */
export function buildBidderActivityInitializationUpdate(candidates: BidderActivityCandidate[]): Prisma.Sql {
  const pending = candidates.filter((candidate) => candidate.needs_initialization);
  if (!pending.length) throw new Error("Initialization update requires pending bidders.");
  const values = pending.map((candidate) => Prisma.sql`
    SELECT ${candidate.bidder_id} AS bidder_id, ${candidate.branch_id} AS branch_id,
      ${candidate.activity_at} AS activity_at
  `);
  return Prisma.sql`
    UPDATE bidders b JOIN (${Prisma.join(values, " UNION ALL ")}) c
      ON c.bidder_id = b.bidder_id AND c.branch_id = b.branch_id
    SET b.last_activity_at = c.activity_at
    WHERE b.last_activity_at IS NULL AND b.deleted_at IS NULL
      AND b.status IN ('ACTIVE', 'INACTIVE') AND b.bidder_number <> ${ATC_DEFAULT_BIDDER_NUMBER}
  `;
}

export async function initializeBidderActivity(
  prisma: PrismaClient,
  options: BidderActivityInitializationOptions,
  now = new Date(),
): Promise<BidderActivityInitializationSummary[]> {
  validateInitializationOptions(options);
  getBidderActivityCutoff(now);
  const summaries = new Map<string, BidderActivityInitializationSummary>();
  let cursor: string | undefined;

  for (;;) {
    const batch = await prisma.$transaction(async (tx) => {
      // Explicit scoping: this maintenance tool deliberately uses an unextended
      // PrismaClient, not the web request's implicit branch filter.
      const bidders = await tx.bidders.findMany({
        where: {
          ...(options.branch_id ? { branch_id: options.branch_id } : {}),
          ...(cursor ? { bidder_id: { gt: cursor } } : {}),
          deleted_at: null,
          status: { in: ["ACTIVE", "INACTIVE"] },
          bidder_number: { not: ATC_DEFAULT_BIDDER_NUMBER },
        },
        select: INITIALIZATION_SELECT,
        orderBy: { bidder_id: "asc" },
        take: options.batch_size,
      });
      if (!bidders.length) return null;
      const pendingIds = bidders.filter((bidder) => bidder.last_activity_at === null).map((bidder) => bidder.bidder_id);
      const evidence = pendingIds.length
        ? await tx.$queryRaw<BidderActivityEvidence[]>(buildBidderActivityEvidenceQuery(pendingIds))
        : [];
      const candidates = planBidderActivityInitialization(bidders, evidence, now);
      const initialized = new Map<string, number>();
      if (options.apply) {
        const branchIds = new Set(candidates.map((candidate) => candidate.branch_id));
        for (const branchId of branchIds) {
          const pending = candidates.filter((candidate) => candidate.branch_id === branchId && candidate.needs_initialization);
          if (pending.length) initialized.set(branchId, await tx.$executeRaw(buildBidderActivityInitializationUpdate(pending)));
        }
      }
      return { bidders, candidates, initialized };
    }, { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead, timeout: 30_000 });

    if (!batch) break;
    for (const [index, candidate] of batch.candidates.entries()) {
      let summary = summaries.get(candidate.branch_id);
      if (!summary) {
        summary = {
          branch_id: candidate.branch_id,
          branch_name: batch.bidders[index].branch.name,
          eligible_bidders: 0, needs_initialization: 0, already_tracked: 0,
          timestamps_initialized: 0, would_activate: 0, would_deactivate: 0, future_activity: 0,
        };
        summaries.set(candidate.branch_id, summary);
      }
      summary.eligible_bidders += 1;
      summary.needs_initialization += Number(candidate.needs_initialization);
      summary.already_tracked += Number(!candidate.needs_initialization);
      summary.would_activate += Number(candidate.would_activate);
      summary.would_deactivate += Number(candidate.would_deactivate);
      summary.future_activity += Number(candidate.future_activity);
    }
    for (const [branchId, count] of batch.initialized) {
      summaries.get(branchId)!.timestamps_initialized += count;
    }
    cursor = batch.bidders[batch.bidders.length - 1].bidder_id;
  }

  return [...summaries.values()].sort((a, b) => a.branch_id.localeCompare(b.branch_id));
}
