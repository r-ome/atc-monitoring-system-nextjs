import { z } from "zod";
import { Prisma } from "@prisma/client";

export type BidderBirthdates = {
  bidder_id: string;
  bidder_number: string;
  first_name: string;
  last_name: string;
  birthdate: string | null;
};

export type AuctionWithUnpaidBidders = {
  auction_id: string;
  created_at: string;
  unpaid_bidders: {
    bidder_id: string;
    bidder_number: string;
    amount: string;
  }[];
};
