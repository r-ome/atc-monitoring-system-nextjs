import { Prisma } from "@prisma/client";
import { RegisteredBidder } from "./Bidder";
import { type InventoryStatus } from "./Inventory";
export type Override<T, R> = Omit<T, keyof R> & R;

export const AUCTION_ITEM_STATUS = [
  "PAID",
  "UNPAID",
  "CANCELLED",
  "REFUNDED",
  "DISCREPANCY",
  "PARTIAL",
] as const;

export type AuctionItemStatus = (typeof AUCTION_ITEM_STATUS)[number];

export const CANCELLED_OR_REFUNDED_AUCTION_ITEM_STATUSES: ReadonlyArray<AuctionItemStatus> =
  ["CANCELLED", "REFUNDED"];

export type AuctionRow = Prisma.auctionsGetPayload<object>;

export type AuctionWithSalesRow = Prisma.auctionsGetPayload<{
  include: {
    branch: true;
    registered_bidders: { include: { auctions_inventories: true } };
  };
}>;

export type AuctionWithDetailsRow = Prisma.auctionsGetPayload<{
  include: {
    registered_bidders: {
      include: {
        bidder: true;
        receipt_records: {
          include: { payments: { include: { payment_method: true } } };
        };
        auctions_inventories: {
          include: {
            inventory: { include: { container: true } };
            receipt: true;
            histories: true;
          };
        };
      };
    };
  };
}>;

export type Auction = {
  auction_id: string;
  auction_date: string;
  registered_bidders: RegisteredBidder[];
};

export type AuctionInventoryRow = Prisma.auctions_inventoriesGetPayload<object>;

export type AuctionInventoryWithHistoriesRow =
  Prisma.auctions_inventoriesGetPayload<{
    include: { histories: true; inventory: true };
  }>;

export type AuctionWithBranchBiddersRow = Prisma.auctionsGetPayload<{
  include: { registered_bidders: { include: { bidder: true } } };
}>;

export type AuctionInventoryWithDetailsRow =
  Prisma.auctions_inventoriesGetPayload<{
    include: {
      auction_bidder: { include: { bidder: true } };
      inventory: true;
      receipt: true;
      histories: { include: { receipt: true } };
    };
  }>;

export type AuctionInventoryWithContainerDetailsRow =
  Prisma.auctions_inventoriesGetPayload<{
    include: {
      auction_bidder: { include: { bidder: true } };
      inventory: {
        include: {
          container: { select: { container_id: true; barcode: true } };
        };
      };
      receipt: true;
      histories: { include: { receipt: true } };
    };
  }>;

export type AuctionInventorySearchRow =
  Prisma.auctions_inventoriesGetPayload<{
    include: {
      auction_bidder: { include: { bidder: true } };
      inventory: true;
    };
  }>;

export const AUCTION_INVENTORY_SEARCH_MODE = [
  "barcode",
  "control",
  "barcode_control",
  "description",
] as const;

export type AuctionInventorySearchMode =
  (typeof AUCTION_INVENTORY_SEARCH_MODE)[number];

export type AuctionInventorySearchInput = {
  raw: string;
  mode: AuctionInventorySearchMode;
  barcode?: string;
  control?: string;
  description?: string;
};

export type AuctionInventorySearchParams = {
  input: AuctionInventorySearchInput;
  offset: number;
  limit: number;
};

export type AuctionInventorySearchResult = {
  auction_inventory_id: string;
  description: string;
  status: AuctionItemStatus;
  price: number;
  qty: string;
  manifest_number: string;
  auction_date: string;
  created_at: string;
  inventory: {
    barcode: string;
    control: string;
    status: InventoryStatus;
  };
  bidder: {
    bidder_number: string;
    full_name: string;
  };
};

export type AuctionInventorySearchPage = {
  items: AuctionInventorySearchResult[];
  hasMore: boolean;
};

const BARCODE_SEGMENT_PATTERN = /^[A-Z0-9]{2}$/;
const BARCODE_ITEM_SEGMENT_PATTERN = /^\d{3}$/;
const CONTROL_SEARCH_PATTERN = /^\d{1,4}$/;

const normalizeControlSearch = (value: string) => value.padStart(4, "0");
const normalizeBarcodeSearch = (value: string) => value.toUpperCase();

const isValidBarcodeSearch = (value: string) => {
  const segments = normalizeBarcodeSearch(value).split("-");

  if (segments.length !== 2 && segments.length !== 3) {
    return false;
  }

  if (!segments.every((segment) => segment.length > 0)) {
    return false;
  }

  if (
    !BARCODE_SEGMENT_PATTERN.test(segments[0]) ||
    !BARCODE_SEGMENT_PATTERN.test(segments[1])
  ) {
    return false;
  }

  if (segments.length === 3 && !BARCODE_ITEM_SEGMENT_PATTERN.test(segments[2])) {
    return false;
  }

  return true;
};

export const parseAuctionInventorySearchInput = (
  rawInput: string,
): AuctionInventorySearchInput => {
  const input = rawInput.trim();

  if (!input) {
    throw new Error(
      "Search is required. Use barcode, control, or barcode:control.",
    );
  }

  const parts = input.split(":").map((part) => part.trim());

  if (parts.length > 2) {
    throw new Error(
      "Only one ':' is allowed. Use barcode, control, or barcode:control.",
    );
  }

  if (parts.length === 2) {
    const [barcode, control] = parts;

    if (!barcode || !control) {
      throw new Error(
        "Both barcode and control are required for barcode:control search.",
      );
    }

    if (!isValidBarcodeSearch(barcode)) {
      throw new Error(
        "Barcode must match AA-00 or AA-00-000 format.",
      );
    }

    if (!CONTROL_SEARCH_PATTERN.test(control)) {
      throw new Error("Control must be a 1 to 4 digit number.");
    }

    return {
      raw: input,
      mode: "barcode_control",
      barcode: normalizeBarcodeSearch(barcode),
      control: normalizeControlSearch(control),
    };
  }

  const [value] = parts;

  if (isValidBarcodeSearch(value)) {
    return {
      raw: input,
      mode: "barcode",
      barcode: normalizeBarcodeSearch(value),
    };
  }

  if (CONTROL_SEARCH_PATTERN.test(value)) {
    return {
      raw: input,
      mode: "control",
      control: normalizeControlSearch(value),
    };
  }

  if (!value.includes("-")) {
    return {
      raw: input,
      mode: "description",
      description: value,
    };
  }

  throw new Error(
    "Search must be barcode, control, barcode:control, or description.",
  );
};

export type AuctionsInventory = {
  auction_inventory_id: string;
  auction_bidder_id: string;
  inventory_id: string;
  receipt_id: string | null;
  description: string;
  status: AuctionItemStatus;
  price: number;
  qty: string;
  manifest_number: string;
  is_slash_item: string | null;
  created_at: string;
  updated_at: string;
  auction_date: string;
  inventory: {
    inventory_id: string;
    barcode: string;
    control: string;
    status: InventoryStatus;
  };
  bidder: {
    bidder_id: string;
    bidder_number: string;
    full_name: string;
    service_charge: number;
    registration_fee: number;
    already_consumed: number;
    balance: number;
  };
  receipt: {
    receipt_id?: string | null;
    receipt_number?: string | null;
  } | null;
  histories: {
    inventory_history_id: string;
    auction_status: AuctionItemStatus;
    inventory_status: InventoryStatus;
    remarks: string | null;
    receipt_number: string | null;
    created_at: string;
  }[];
};

export type AuctionDateRange = { start: Date; end: Date };
