export const CANCEL_REFUND_TAG_VALUES = [
  "MISSING",
  "DAMAGED",
  "NOT_DECLARED_DAMAGED",
  "WRONG_BIDDER",
  "REBID",
  "DOUBLE_ENCODE",
  "WRONG_ENCODE",
  "NOT_CLAIMED",
  "INVOICE_ERROR",
  "VOIDED",
  "OTHER",
] as const;

export type CancelRefundTag = (typeof CANCEL_REFUND_TAG_VALUES)[number];

export const CANCEL_REFUND_TAG_LABELS: Record<CancelRefundTag, string> = {
  MISSING: "Missing",
  DAMAGED: "Damaged",
  NOT_DECLARED_DAMAGED: "Not Declared Damaged",
  WRONG_BIDDER: "Wrong Bidder",
  REBID: "Rebid",
  DOUBLE_ENCODE: "Double Encode",
  WRONG_ENCODE: "Wrong Encode",
  NOT_CLAIMED: "Not Claimed",
  INVOICE_ERROR: "Invoice Error",
  VOIDED: "Voided",
  OTHER: "Other",
};

// Order matters — more specific patterns first. Keep this function pure (no
// imports beyond what's needed) so it can run on both the client (live preview
// in the modal) and the server (authoritative tag at write time + backfill).
export function inferCancelRefundTag(reason: string | null | undefined): CancelRefundTag {
  const r = (reason ?? "").toUpperCase();
  if (!r.trim()) return "OTHER";
  if (/NOT DECLARED?|MISDECLAR|MISDEC|WRONG DECLAR|WRONG DECLER|NOT DECLARE/.test(r)) return "NOT_DECLARED_DAMAGED";
  if (/\b(MISSING|NOT FOUND|UNFOUND|HINDI MAKITA)\b/.test(r)) return "MISSING";
  if (/\b(DAMAGE|DAMAGED|SCRATCH|SCRATCHES)\b/.test(r)) return "DAMAGED";
  if (/REBID/.test(r)) return "REBID";
  if (/DOUBLE (ENCODE|PRICE)/.test(r)) return "DOUBLE_ENCODE";
  if (/WRONG (BARCODE|DESCRIPTION|DATE|ENCODE|CONTROL)|ORIGINAL PRICE|IN RECEIPT.*IN CONTROL/.test(r)) return "WRONG_ENCODE";
  if (/BELONG TO BIDDER|TO BIDDER|FOR BIDDER|WRONG BIDDER|\bBIDDER \d/.test(r)) return "WRONG_BIDDER";
  if (/HINDI KUMUKUHA/.test(r)) return "NOT_CLAIMED";
  if (/INVOICE|ADD ON|ADD-ON|NA ADD|NEXT PAYMENT/.test(r)) return "INVOICE_ERROR";
  if (/VOID/.test(r)) return "VOIDED";
  return "OTHER";
}

type InventoryHistoryAction =
  | "encoded"
  | "bought_item_encoded"
  | "reassigned"
  | "encoded_again"
  | "manifest_reencoded"
  | "cancelled"
  | "refunded"
  | "partial_refund"
  | "pullout_paid"
  | "pullout_undone"
  | "item_updated"
  | "inventory_file_created"
  | "inventory_file_updated"
  | "item_merged"
  | "item_split_bought"
  | "item_voided"
  | "item_direct_bought";

type BidderIdentity = {
  bidder_number: string;
  bidder_name: string;
};

type PriceChange = {
  previous_price: number;
  new_price: number;
};

type InventoryHistoryRemarkData = {
  action?: InventoryHistoryAction;
  bidder_number?: string;
  bidder_name?: string;
  reason?: string;
  previous_status?: string;
  previous_price?: number;
  new_price?: number;
  updated_by?: string;
  changes?: string[];
  // item_merged fields
  unsold_barcode?: string;
  unsold_control?: string;
  sold_barcode?: string;
  sold_control?: string;
  // item_split_bought fields
  source_barcode?: string;
  source_control?: string;
  split_price?: number;
  split_qty?: string;
};

const HISTORY_PREFIXES = {
  encoded: "Item encoded",
  bought_item_encoded: "Bought item encoded",
  reassigned: "Item reassigned",
  encoded_again: "Item encoded again",
  manifest_reencoded: "Manifest item re-encoded",
  cancelled: "Cancelled item",
  refunded: "Refunded item",
  partial_refund: "Partial refund",
  pullout_paid: "Pull-out paid",
  pullout_undone: "Pull-out undone",
  item_updated: "Item updated",
  inventory_file_created: "Inventory created from inventory file upload",
  inventory_file_updated: "Inventory file updated",
  item_merged: "Item merged",
  item_split_bought: "Item split bought",
  item_voided: "Item voided from final report",
  item_direct_bought: "Item set as Bought Item",
} as const;

function buildBidderPart(bidder: BidderIdentity) {
  return `Bidder: #${bidder.bidder_number} ${bidder.bidder_name}`;
}

function sanitizePart(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

export function buildEncodedHistoryRemark(updated_by?: string) {
  if (!updated_by) return HISTORY_PREFIXES.encoded;

  return `${HISTORY_PREFIXES.encoded} | Updated by: ${sanitizePart(updated_by)}`;
}

export function buildBoughtItemEncodedHistoryRemark(updated_by?: string) {
  if (!updated_by) return HISTORY_PREFIXES.bought_item_encoded;

  return `${HISTORY_PREFIXES.bought_item_encoded} | Updated by: ${sanitizePart(updated_by)}`;
}

export function buildReassignedHistoryRemark() {
  return HISTORY_PREFIXES.reassigned;
}

export function buildEncodedAgainHistoryRemark(previous_status: string) {
  return `${HISTORY_PREFIXES.encoded_again} | Previous status: ${previous_status}`;
}

export function buildManifestReencodedHistoryRemark(previous_status: string) {
  return `${HISTORY_PREFIXES.manifest_reencoded} | Previous status: ${previous_status}`;
}

export function buildCancelledHistoryRemark(
  bidder: BidderIdentity,
  reason: string,
  updated_by?: string,
) {
  const parts = [
    HISTORY_PREFIXES.cancelled,
    buildBidderPart(bidder),
    `Reason: ${sanitizePart(reason)}`,
  ];

  if (updated_by) {
    parts.push(`Updated by: ${sanitizePart(updated_by)}`);
  }

  return parts.join(" | ");
}

export function buildRefundedHistoryRemark(
  bidder: BidderIdentity,
  reason: string,
  updated_by?: string,
) {
  const parts = [
    HISTORY_PREFIXES.refunded,
    buildBidderPart(bidder),
    `Reason: ${sanitizePart(reason)}`,
  ];

  if (updated_by) {
    parts.push(`Updated by: ${sanitizePart(updated_by)}`);
  }

  return parts.join(" | ");
}

export function buildPartialRefundHistoryRemark(
  bidder: BidderIdentity,
  reason: string,
  price_change: PriceChange,
  updated_by?: string,
) {
  const parts = [
    HISTORY_PREFIXES.partial_refund,
    buildBidderPart(bidder),
    `Reason: ${sanitizePart(reason)}`,
    `Price: ${price_change.previous_price} → ${price_change.new_price}`,
  ];

  if (updated_by) {
    parts.push(`Updated by: ${sanitizePart(updated_by)}`);
  }

  return parts.join(" | ");
}

export function buildPulloutPaidHistoryRemark() {
  return HISTORY_PREFIXES.pullout_paid;
}

export function buildPulloutUndoneHistoryRemark() {
  return HISTORY_PREFIXES.pullout_undone;
}

export function buildItemUpdatedHistoryRemark(input: {
  changes: string[];
  updated_by?: string;
}) {
  const parts = [
    HISTORY_PREFIXES.item_updated,
    ...input.changes.map((change) => sanitizePart(change)),
  ];

  if (input.updated_by) {
    parts.push(`Updated by: ${sanitizePart(input.updated_by)}`);
  }

  return parts.join(" | ");
}

export function buildInventoryFileUpdatedHistoryRemark(input: {
  changes: string[];
  updated_by?: string;
}) {
  const parts = [
    HISTORY_PREFIXES.inventory_file_updated,
    ...input.changes.map((change) => sanitizePart(change)),
  ];

  if (input.updated_by) {
    parts.push(`Updated by: ${sanitizePart(input.updated_by)}`);
  }

  return parts.join(" | ");
}

export function buildInventoryFileCreatedHistoryRemark(updated_by?: string) {
  if (!updated_by) return HISTORY_PREFIXES.inventory_file_created;

  return `${HISTORY_PREFIXES.inventory_file_created} | Updated by: ${sanitizePart(updated_by)}`;
}

export function buildItemMergedHistoryRemark(params: {
  unsold_barcode: string;
  unsold_control: string;
  sold_barcode: string;
  sold_control: string;
}): string {
  return `${HISTORY_PREFIXES.item_merged}: UNSOLD duplicate (barcode: ${params.unsold_barcode}, ctrl: ${params.unsold_control}) was merged into SOLD item (barcode: ${params.sold_barcode}, ctrl: ${params.sold_control}). SOLD item barcode updated to ${params.unsold_barcode}. UNSOLD duplicate has been soft-deleted.`;
}

export function buildItemSplitBoughtHistoryRemark(params: {
  source_barcode: string;
  source_control: string;
  split_price: number;
  split_qty: string;
}): string {
  return `${HISTORY_PREFIXES.item_split_bought}: UNSOLD item split from SOLD item (barcode: ${params.source_barcode}, ctrl: ${params.source_control}). Split price: ${params.split_price}, qty: ${params.split_qty}. Recorded as Bought Item.`;
}

export function buildItemVoidedHistoryRemark(): string {
  return HISTORY_PREFIXES.item_voided;
}

export function buildItemDirectBoughtHistoryRemark(params: {
  price: number;
  qty: string;
}): string {
  return `${HISTORY_PREFIXES.item_direct_bought}: price: ${params.price}, qty: ${params.qty}.`;
}

function parseLabeledField(
  text: string,
  label: string,
  next_labels: string[],
) {
  const escaped_label = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const boundary = next_labels
    .map((next_label) => next_label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join("|");
  const pattern = boundary.length
    ? new RegExp(`${escaped_label}:\\s*(.+?)(?=\\s*\\|\\s*(?:${boundary}):|$)`)
    : new RegExp(`${escaped_label}:\\s*(.+)$`);

  return text.match(pattern)?.[1]?.trim();
}

function parsePriceArrow(text: string) {
  const match = text.match(/(\d+)\s*(?:→|\u002d>)\s*(\d+)/);
  if (!match) return null;

  return {
    previous_price: Number(match[1]),
    new_price: Number(match[2]),
  };
}

export function parseInventoryHistoryRemark(
  remarks: string | null | undefined,
): InventoryHistoryRemarkData {
  if (!remarks) return {};

  const trimmed = remarks.trim();

  if (trimmed === HISTORY_PREFIXES.encoded) return { action: "encoded" };
  if (trimmed.startsWith(`${HISTORY_PREFIXES.encoded} | `)) {
    return {
      action: "encoded",
      updated_by: parseLabeledField(trimmed, "Updated by", []),
    };
  }
  if (trimmed === HISTORY_PREFIXES.bought_item_encoded) {
    return { action: "bought_item_encoded" };
  }
  if (trimmed.startsWith(`${HISTORY_PREFIXES.bought_item_encoded} | `)) {
    return {
      action: "bought_item_encoded",
      updated_by: parseLabeledField(trimmed, "Updated by", []),
    };
  }
  if (trimmed === HISTORY_PREFIXES.reassigned) return { action: "reassigned" };
  if (trimmed === HISTORY_PREFIXES.pullout_paid) return { action: "pullout_paid" };
  if (trimmed === HISTORY_PREFIXES.pullout_undone) return { action: "pullout_undone" };
  if (trimmed.startsWith(HISTORY_PREFIXES.item_merged)) {
    const legacyMatch = trimmed.match(
      /UNSOLD item \(barcode: (.+?), ctrl: (.+?)\) was linked to SOLD item \(barcode: (.+?), ctrl: (.+?)\)/,
    );
    const duplicateMatch = trimmed.match(
      /UNSOLD duplicate \(barcode: (.+?), ctrl: (.+?)\) was merged into SOLD item \(barcode: (.+?), ctrl: (.+?)\)/,
    );
    const match = duplicateMatch ?? legacyMatch;
    if (match) {
      return {
        action: "item_merged",
        unsold_barcode: match[1],
        unsold_control: match[2],
        sold_barcode: match[3],
        sold_control: match[4],
      };
    }
    return { action: "item_merged" };
  }
  if (trimmed.startsWith(HISTORY_PREFIXES.item_split_bought)) {
    const match = trimmed.match(
      /SOLD item \(barcode: (.+?), ctrl: (.+?)\)\. Split price: (\d+), qty: (.+?)\./,
    );
    if (match) {
      return {
        action: "item_split_bought",
        source_barcode: match[1],
        source_control: match[2],
        split_price: Number(match[3]),
        split_qty: match[4],
      };
    }
    return { action: "item_split_bought" };
  }
  if (trimmed === HISTORY_PREFIXES.item_voided) return { action: "item_voided" };
  if (trimmed.startsWith(HISTORY_PREFIXES.item_direct_bought)) return { action: "item_direct_bought" };

  if (trimmed.startsWith(`${HISTORY_PREFIXES.encoded_again} | `)) {
    return {
      action: "encoded_again",
      previous_status: parseLabeledField(trimmed, "Previous status", []),
    };
  }

  if (trimmed.startsWith(`${HISTORY_PREFIXES.manifest_reencoded} | `)) {
    return {
      action: "manifest_reencoded",
      previous_status: parseLabeledField(trimmed, "Previous status", []),
    };
  }

  if (
    trimmed.startsWith(`${HISTORY_PREFIXES.cancelled} | `) ||
    trimmed.startsWith(`${HISTORY_PREFIXES.refunded} | `) ||
    trimmed.startsWith(`${HISTORY_PREFIXES.partial_refund} | `)
  ) {
    const bidder = parseLabeledField(trimmed, "Bidder", ["Reason", "Price"]);
    const bidder_match = bidder?.match(/^#(\S+)\s+(.+)$/);
    const price = parsePriceArrow(
      parseLabeledField(trimmed, "Price", []) ?? "",
    );

    return {
      action: trimmed.startsWith(HISTORY_PREFIXES.cancelled)
        ? "cancelled"
        : trimmed.startsWith(HISTORY_PREFIXES.refunded)
          ? "refunded"
          : "partial_refund",
      bidder_number: bidder_match?.[1],
      bidder_name: bidder_match?.[2],
      reason: parseLabeledField(trimmed, "Reason", ["Price", "Updated by"]),
      updated_by: parseLabeledField(trimmed, "Updated by", []),
      previous_price: price?.previous_price,
      new_price: price?.new_price,
    };
  }

  if (trimmed.startsWith(`${HISTORY_PREFIXES.item_updated} | `)) {
    const sections = trimmed.split(" | ").slice(1);
    const changes = sections.filter((section) => !section.startsWith("Updated by: "));
    const price_section = changes.find((section) => section.startsWith("Price: "));
    const parsed_price = parsePriceArrow(price_section ?? "");

    return {
      action: "item_updated",
      changes,
      updated_by: parseLabeledField(trimmed, "Updated by", []),
      previous_price: parsed_price?.previous_price,
      new_price: parsed_price?.new_price,
    };
  }

  if (trimmed === HISTORY_PREFIXES.inventory_file_created) {
    return { action: "inventory_file_created" };
  }

  if (trimmed.startsWith(`${HISTORY_PREFIXES.inventory_file_created} | `)) {
    return {
      action: "inventory_file_created",
      updated_by: parseLabeledField(trimmed, "Updated by", []),
    };
  }

  if (trimmed.startsWith(`${HISTORY_PREFIXES.inventory_file_updated} | `)) {
    const sections = trimmed.split(" | ").slice(1);
    const changes = sections.filter((section) => !section.startsWith("Updated by: "));

    return {
      action: "inventory_file_updated",
      changes,
      updated_by: parseLabeledField(trimmed, "Updated by", []),
    };
  }

  // Legacy fallbacks
  const cancelled_match = trimmed.match(/^Cancelled from bidder #(\S+) \((.+?)\): (.+)$/);
  if (cancelled_match) {
    return {
      action: "cancelled",
      bidder_number: cancelled_match[1],
      bidder_name: cancelled_match[2],
      reason: cancelled_match[3],
    };
  }

  const refunded_match = trimmed.match(/^REFUNDED from bidder #(\S+) \((.+?)\): (.+)$/);
  if (refunded_match) {
    return {
      action: "refunded",
      bidder_number: refunded_match[1],
      bidder_name: refunded_match[2],
      reason: refunded_match[3],
    };
  }

  const partial_refund_match = trimmed.match(
    /^PARTIAL REFUND:\s*(.+?)\.\s*\(LESS\)\s*From\s*(\d+)\s*to\s*(\d+)/i,
  );
  if (partial_refund_match) {
    return {
      action: "partial_refund",
      reason: partial_refund_match[1],
      previous_price: Number(partial_refund_match[2]),
      new_price: Number(partial_refund_match[3]),
    };
  }

  const price_update_match = trimmed.match(/(?:price:|from)\s*(\d+)\s*to\s*(\d+)/i);
  if (price_update_match) {
    return {
      previous_price: Number(price_update_match[1]),
      new_price: Number(price_update_match[2]),
    };
  }

  // Legacy compatibility for old stored history remarks after the VOID workflow removal.
  if (trimmed === "Item voided") {
    return {};
  }

  return {};
}
