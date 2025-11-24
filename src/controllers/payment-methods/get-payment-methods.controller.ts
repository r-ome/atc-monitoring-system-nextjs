import { PaymentMethodsSchema } from "src/entities/models/PaymentMethod";
import { formatDate } from "@/app/lib/utils";
import { ok, err } from "src/entities/models/Response";
import { DatabaseOperationError } from "src/entities/errors/common";
import { logger } from "@/app/lib/logger";
import { getPaymentMethods } from "src/application/use-cases/payment-methods/get-payment-methods.use-case";

const presenter = (payment_methods: PaymentMethodsSchema[]) => {
  const date_format = "MMM dd, yyyy hh:mm a";
  return payment_methods.map((item) => ({
    ...item,
    created_at: formatDate(item.created_at, date_format),
    updated_at: formatDate(item.updated_at, date_format),
    deleted_at: item.deleted_at
      ? formatDate(item.created_at, date_format)
      : null,
  }));
};

export const GetPaymentMethodsController = async () => {
  try {
    const payment_methods = await getPaymentMethods();
    return ok(presenter(payment_methods));
  } catch (error) {
    logger("GetPaymentMethodsController", error);
    if (error instanceof DatabaseOperationError) {
      return err({
        message: "Server Error",
        cause: error.message,
      });
    }

    return err({
      message: "An error occurred! Please contact your admin!",
      cause: "Server Error",
    });
  }
};
