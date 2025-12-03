import { z } from "zod";
import { Prisma } from "@prisma/client";

export type BidderBirthdates = {
  bidder_id: string;
  bidder_number: string;
  first_name: string;
  last_name: string;
  birthdate: string | null;
};

export type UnpaidBidders = {
  bidder_id: string;
  bidder_number: string;
  first_name: string;
  last_name: string;
  auction_date: string;
  balance: number;
  items: number;
};
