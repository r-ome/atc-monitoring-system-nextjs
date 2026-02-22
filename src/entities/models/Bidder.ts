import { z } from "zod";
import { Prisma } from "@prisma/client";
import { AuctionsInventory, AuctionInventoryWithDetailsRow } from "./Auction";
import { PaymentMethod } from "./PaymentMethod";

export const BIDDER_STATUS = ["BANNED", "ACTIVE", "INACTIVE"] as const;
export type BidderStatus = (typeof BIDDER_STATUS)[number];

export type BidderRow = Prisma.biddersGetPayload<object>;

export type BidderWithBranchRow = Prisma.biddersGetPayload<{
  include: { branch: true };
}>;

export type BidderWithLastAuctionRow = Prisma.biddersGetPayload<{
  include: { branch: true; auctions_joined: true };
}>;

export type BidderWithDetailsRow = Prisma.biddersGetPayload<{
  include: {
    branch: true;
    auctions_joined: { include: { auctions_inventories: true } };
    requirements: true;
  };
}>;

export type Bidder = {
  bidder_id: string;
  bidder_number: string;
  first_name: string;
  middle_name?: string | null;
  last_name: string;
  full_name: string;
  birthdate?: string | null;
  contact_number?: string | null;
  address?: string | null;
  tin_number?: string | null;
  store_name?: string | null;
  registration_fee: number;
  service_charge: number;
  status: BidderStatus;
  remarks?: string;
  created_at: string;
  updated_at: string;
  payment_term: number;
  branch: {
    branch_id: string | null;
    name: string | null;
  };
  auctions_joined: {
    auction_bidder_id: string;
    auction_id: string;
    service_charge: number;
    registration_fee: number;
    balance: number;
    created_at: string;
    auctions_inventories: AuctionInventoryWithDetailsRow[];
  }[];
};

/** CREATE BIDDER */
export const createBidderSchema = z.object({
  bidder_number: z.string().min(1),
  first_name: z.string().min(1),
  middle_name: z.string().optional().nullable(),
  last_name: z.string().min(1),
  birthdate: z.date().optional().nullable(),
  branch_id: z.string().min(1),
  contact_number: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  tin_number: z.string().optional().nullable(),
  store_name: z.string().optional().nullable(),
  registration_fee: z.coerce.number(),
  service_charge: z.coerce.number(),
  status: z.enum(BIDDER_STATUS),
  payment_term: z.coerce.number(),
});

export type CreateBidderInput = z.infer<typeof createBidderSchema>;

export const updateBidderRegistrationSchema = z.object({
  service_charge: z.coerce.number(),
  registration_fee: z.coerce.number(),
});

export type UpdateBidderRegistrationInput = z.infer<
  typeof updateBidderRegistrationSchema
>;

export const registerBidderSchema = z.object({
  auction_id: z.string(),
  bidder_id: z.string(),
  service_charge: z.coerce.number(),
  registration_fee: z.coerce.number(),
  balance: z.coerce.number(),
  payments: z.array(
    z.object({
      payment_method: z.string(),
      amount_paid: z.number(),
    }),
  ),
});

export type RegisterBidderInput = z.infer<typeof registerBidderSchema>;

export type RegisteredBidderSchema = Prisma.auctions_biddersGetPayload<{
  include: {
    auctions_inventories: {
      include: {
        receipt: true;
        inventory: { include: { container: true } };
        histories: { include: { receipt: true } };
      };
    };
    bidder: true;
  };
}>;

export type RegisteredBidder = {
  auction_bidder_id: string;
  auction_id: string;
  auction_date: string;
  created_at: string;
  service_charge: number;
  registration_fee: number;
  already_consumed: number;
  balance: number;
  payment_method?: PaymentMethod["name"];
  bidder: {
    bidder_id: string;
    bidder_number: string;
    full_name: string;
    service_charge: number;
    registration_fee: number;
  };
  auction_inventories: Omit<AuctionsInventory, "bidder" | "histories">[];
};

export type AuctionBidderSchema = {
  auction_bidder_id: string;
  auction_id: string;
  bidder_id: string;
  service_charge: number;
  already_consumed: number;
  registration_fee: number;
  balance: number;
  created_at: Date;
  bidder: BidderRow;
};

export type BiddersWithBirthdatesAndRecentAuctionSchema = {
  bidder_id: string;
  bidder_number: string;
  first_name: string;
  last_name: string;
  birthdate: string;
  age: string;
  last_auction_date: string;
};

export type UnpaidAuctionsBiddersSchema = Prisma.auctions_biddersGetPayload<{
  include: { auctions_inventories: true; bidder: true };
}>;

export type BidderSheetRecord = Record<
  | "BIDDER_NUMBER"
  | "FIRST_NAME"
  | "MIDDLE_NAME"
  | "LAST_NAME"
  | "SERVICE_CHARGE"
  | "REGISTRATION_FEE"
  | "CONTACT_NUMBER"
  | "BIRTHDATE"
  | "ADDRESS"
  | "TIN_NUMBER",
  string
>;

export const createBidderBulkSchmea = z.object({
  BIDDER_NUMBER: z.string(),
  FIRST_NAME: z.string(),
  MIDDLE_NAME: z.string(),
  LAST_NAME: z.string(),
  SERVICE_CHARGE: z.string(),
  REGISTRATION_FEE: z.string(),
  BIRTHDATE: z.string().optional().nullable(),
  ADDRESS: z.string().optional().nullable(),
  TIN_NUMBER: z.string().optional().nullable(),
  CONTACT_NUMBER: z.string().optional().nullable(),
  branch_id: z.string(),
  isValid: z.boolean(),
  status: z.string().optional(),
  error: z.string(),
});

export type CreateBidderBulkInput = z.infer<typeof createBidderBulkSchmea>;
