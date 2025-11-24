import {
  PaymentMethodsSchema,
  PaymentMethodInsertSchema,
} from "src/entities/models/PaymentMethod";

export interface IPaymentMethodReposistory {
  getPaymentMethods: () => Promise<PaymentMethodsSchema[]>;
  createPaymentMethod: (
    data: PaymentMethodInsertSchema
  ) => Promise<PaymentMethodsSchema>;
  updatePaymentMethod: (
    payment_method_id: string,
    data: PaymentMethodInsertSchema
  ) => Promise<PaymentMethodsSchema>;
}
