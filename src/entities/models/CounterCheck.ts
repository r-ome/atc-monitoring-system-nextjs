import { z } from "zod";
import { Prisma } from "@prisma/client";

export type CounterCheckRow = Prisma.counter_checkGetPayload<object>;

export type CounterCheckRecord = Record<
  "CONTROL" | "BIDDER" | "PAGE" | "PRICE" | "DESCRIPTION" | "TIME",
  string
>;

export const updateCounterCheckSchema = z.object({
  control: z.string(),
  bidder_number: z.string(),
  price: z.coerce.string(),
  page: z.coerce.string(),
  time: z.coerce.string(),
  description: z.coerce.string(),
  remarks: z.string().optional().nullable(),
});

export type UpdateCounterCheckInput = z.infer<typeof updateCounterCheckSchema>;

export const uploadCounterCheckSchema = z.object({
  CONTROL: z.string(),
  BIDDER: z.string(),
  PRICE: z.coerce.string(),
  PAGE: z.coerce.string(),
  DESCRIPTION: z.coerce.string(),
  TIME: z.coerce.string(),
});

export type UploadCounterCheckInput = z.infer<typeof uploadCounterCheckSchema>;

export type CounterCheck = {
  counter_check_id: string;
  auction_id: string;
  control?: string | null;
  bidder_number?: string | null;
  price?: string | null;
  page?: string | null;
  time?: string | null;
  description?: string | null;
  error?: string | null;
  remarks?: string | null;
  created_at: string;
  updated_at: string;
};
