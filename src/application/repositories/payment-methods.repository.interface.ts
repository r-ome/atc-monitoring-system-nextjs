import {
  PaymentMethodRow,
  CreatePaymentMethodInput,
} from "src/entities/models/PaymentMethod";

export interface IPaymentMethodRepository {
  getPaymentMethods: () => Promise<PaymentMethodRow[]>;
  createPaymentMethod: (
    data: CreatePaymentMethodInput
  ) => Promise<PaymentMethodRow>;
  updatePaymentMethod: (
    payment_method_id: string,
    data: CreatePaymentMethodInput
  ) => Promise<PaymentMethodRow>;
}
