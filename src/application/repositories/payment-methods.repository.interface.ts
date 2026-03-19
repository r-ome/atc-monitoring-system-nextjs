import {
  PaymentMethodRow,
  CreatePaymentMethodInput,
  UpdatePaymentMethodInput,
} from "src/entities/models/PaymentMethod";

export interface IPaymentMethodRepository {
  getPaymentMethods: () => Promise<PaymentMethodRow[]>;
  getEnabledPaymentMethods: () => Promise<PaymentMethodRow[]>;
  createPaymentMethod: (data: CreatePaymentMethodInput) => Promise<PaymentMethodRow>;
  updatePaymentMethod: (
    payment_method_id: string,
    data: UpdatePaymentMethodInput
  ) => Promise<PaymentMethodRow>;
}
