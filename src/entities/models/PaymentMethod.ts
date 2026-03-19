import { z } from "zod";
import { Prisma } from "@prisma/client";

export type PaymentMethodRow = Prisma.payment_methodsGetPayload<object>;

export const createPaymentMethodSchema = z.object({
  name: z.string().min(1),
  state: z.enum(["ENABLED", "DISABLED"]),
});

export const updatePaymentMethodSchema = createPaymentMethodSchema;

export type CreatePaymentMethodInput = z.infer<typeof createPaymentMethodSchema>;
export type UpdatePaymentMethodInput = z.infer<typeof updatePaymentMethodSchema>;

export type PaymentMethod = {
  payment_method_id: string;
  name: string;
  state: "ENABLED" | "DISABLED";
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};
