import { PaymentMethodRow } from "src/entities/models/PaymentMethod";
import { formatDate } from "@/app/lib/utils";
import { ok, err } from "src/entities/models/Result";
import { DatabaseOperationError } from "src/entities/errors/common";
import { logger } from "@/app/lib/logger";
import { PaymentMethodRepository } from "src/infrastructure/di/repositories";

const DATE_FORMAT = "MMM dd, yyyy hh:mm a";

const presenter = (payment_methods: PaymentMethodRow[]) => {
  return payment_methods.map((item) => ({
    ...item,
    created_at: formatDate(item.created_at, DATE_FORMAT),
    updated_at: formatDate(item.updated_at, DATE_FORMAT),
    deleted_at: item.deleted_at
      ? formatDate(item.deleted_at, DATE_FORMAT)
      : null,
  }));
};

export const GetPaymentMethodsController = async () => {
  try {
    const payment_methods = await PaymentMethodRepository.getPaymentMethods();
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

export const GetEnabledPaymentMethodsController = async () => {
  try {
    const payment_methods = await PaymentMethodRepository.getEnabledPaymentMethods();
    return ok(presenter(payment_methods));
  } catch (error) {
    logger("GetEnabledPaymentMethodsController", error);
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
