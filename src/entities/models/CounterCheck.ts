import { z } from "zod";
import { Prisma } from "@prisma/client";

export type CounterCheckSchema = Prisma.counter_checkGetPayload<object>;

export type CounterCheckRecord = Record<
  "CONTROL" | "BIDDER" | "PAGE" | "PRICE",
  string
>;

export const CounterCheckUpdateSchema = z.object({
  control: z.string(),
  bidder_number: z.string(),
  price: z.coerce.string(),
  page: z.coerce.string(),
});

export type CounterCheckUpdateSchema = z.infer<typeof CounterCheckUpdateSchema>;

export const CounterCheckInsertSchema = z.object({
  CONTROL: z.string(),
  BIDDER: z.string(),
  PRICE: z.coerce.string(),
  PAGE: z.coerce.string(),
  // error: z.string(),
  // isValid: z.boolean(),
});

export type CounterCheckInsertSchema = z.infer<typeof CounterCheckInsertSchema>;

export type CounterCheck = {
  counter_check_id: string;
  auction_id: string;
  control?: string | null;
  bidder_number?: string | null;
  price?: string | null;
  page?: string | null;
  error?: string | null;
  created_at: string;
  updated_at: string;
};
