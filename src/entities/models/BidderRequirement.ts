import { z } from "zod";
import { Prisma } from "@prisma/client";

export type BidderRequirementRow = Prisma.bidder_requirementsGetPayload<object>;

export type BidderRequirement = {
  requirement_id: string;
  bidder_id: string;
  name: string;
  url: string | null;
  validity_date: string | null;
  created_at: string;
  updated_at: string;
};

export const createBidderRequirementSchema = z.object({
  name: z.string().min(1),
  url: z.string().optional().nullable(),
  validity_date: z.date().optional().nullable(),
});

export type CreateBidderRequirementInput = z.infer<
  typeof createBidderRequirementSchema
>;

export const updateBidderRequirementSchema = z.object({
  name: z.string().min(1),
  url: z.string().optional().nullable(),
  validity_date: z.date().optional().nullable(),
});

export type UpdateBidderRequirementInput = z.infer<
  typeof updateBidderRequirementSchema
>;
