import { z } from "zod";
import { Prisma } from "@prisma/client";
import { AuctionsInventory, AuctionsInventorySchema } from "./Auction";
import { PAYMENT_TYPE } from "./Payment";

export const BIDDER_STATUS = ["BANNED", "ACTIVE", "INACTIVE"] as const;
export type BIDDER_STATUS = "BANNED" | "ACTIVE" | "INACTIVE";

export type BidderSchema = Prisma.biddersGetPayload<{
  include: {
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
  status: BIDDER_STATUS;
  remarks?: string;
  registered_at: string;
  created_at: string;
  updated_at: string;
  payment_term: number;
  auctions_joined: {
    auction_bidder_id: string;
    auction_id: string;
    service_charge: number;
    registration_fee: number;
    balance: number;
    created_at: string;
    auctions_inventories: AuctionsInventorySchema[];
  }[];
};

export const BidderInsertSchema = z.object({
  bidder_number: z.string(),
  first_name: z.string(),
  middle_name: z.string().optional().nullable(),
  last_name: z.string(),
  birthdate: z.date().optional().nullable(),
  contact_number: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  tin_number: z.string().optional().nullable(),
  store_name: z.string().optional().nullable(),
  registration_fee: z.coerce.number(),
  service_charge: z.coerce.number(),
  status: z.enum(BIDDER_STATUS),
  registered_at: z.string(),
  payment_term: z.coerce.number(),
});

export type BidderInsertSchema = z.infer<typeof BidderInsertSchema>;

export const RegisterBidderInput = z.object({
  auction_id: z.string(),
  bidder_id: z.string(),
  service_charge: z.coerce.number(),
  registration_fee: z.coerce.number(),
  balance: z.coerce.number(),
  payments: z.array(
    z.object({
      payment_type: z.enum(PAYMENT_TYPE),
      amount_paid: z.number(),
    })
  ),
});

export type RegisterBidderInputSchema = z.infer<typeof RegisterBidderInput>;

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
  payment_method?: PAYMENT_TYPE;
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
  bidder: BidderSchema;
};
