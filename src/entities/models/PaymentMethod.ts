import { z } from "zod";
import { Prisma } from "@prisma/client";

export type PaymentMethodsSchema = Prisma.payment_methodsGetPayload<object>;

export const PaymentMethodInsertSchema = z.object({
  name: z.string(),
  state: z.enum(["ENABLED", "DISABLED"]),
});

export type PaymentMethodInsertSchema = z.infer<
  typeof PaymentMethodInsertSchema
>;

export type PaymentMethod = {
  payment_method_id: string;
  name: string;
  state: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};
