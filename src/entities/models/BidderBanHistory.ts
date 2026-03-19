import { z } from "zod";
import { Prisma } from "@prisma/client";

export type BidderBanHistoryRow =
  Prisma.bidder_ban_historiesGetPayload<object>;

export type BidderBanHistoryWithBidderRow =
  Prisma.bidder_ban_historiesGetPayload<{
    include: { bidder: { include: { branch: true } } };
  }>;

export type BidderBanHistory = {
  bidder_ban_history_id: string;
  bidder_id: string;
  remarks: string;
  created_at: string;
  updated_at: string;
};

// Raw shape returned by the cross-branch SQL query
export type BannedBidderRow = {
  bidder_id: string;
  bidder_number: string;
  first_name: string;
  last_name: string;
  branch_name: string;
  bidder_ban_history_id: string | null;
  remarks: string | null;
  banned_at: Date | null;
};

export type BannedBidder = {
  bidder_id: string;
  bidder_number: string;
  full_name: string;
  branch_name: string;
  remarks: string | null;
  banned_at: string | null;
};

export const createBanHistorySchema = z.object({
  remarks: z.string().min(1),
});

export type CreateBanHistoryInput = z.infer<typeof createBanHistorySchema>;
