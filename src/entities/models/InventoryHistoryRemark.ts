type InventoryHistoryAction =
  | "encoded"
  | "reassigned"
  | "encoded_again"
  | "manifest_reencoded"
  | "cancelled"
  | "refunded"
  | "partial_refund"
  | "pullout_paid"
  | "pullout_undone"
  | "item_updated"
  | "item_merged";

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
};

const HISTORY_PREFIXES = {
  encoded: "Item encoded",
  reassigned: "Item reassigned",
  encoded_again: "Item encoded again",
  manifest_reencoded: "Manifest item re-encoded",
  cancelled: "Cancelled item",
  refunded: "Refunded item",
  partial_refund: "Partial refund",
  pullout_paid: "Pull-out paid",
  pullout_undone: "Pull-out undone",
  item_updated: "Item updated",
  item_merged: "Item merged",
} as const;

function buildBidderPart(bidder: BidderIdentity) {
  return `Bidder: #${bidder.bidder_number} ${bidder.bidder_name}`;
}

function sanitizePart(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

export function buildEncodedHistoryRemark() {
  return HISTORY_PREFIXES.encoded;
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
    `Price: ${price_change.previous_price} -> ${price_change.new_price}`,
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

export function buildItemMergedHistoryRemark() {
  return HISTORY_PREFIXES.item_merged;
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
  const match = text.match(/(\d+)\s*->\s*(\d+)/);
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
  if (trimmed === HISTORY_PREFIXES.reassigned) return { action: "reassigned" };
  if (trimmed === HISTORY_PREFIXES.pullout_paid) return { action: "pullout_paid" };
  if (trimmed === HISTORY_PREFIXES.pullout_undone) return { action: "pullout_undone" };
  if (trimmed === HISTORY_PREFIXES.item_merged) return { action: "item_merged" };

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
