import { logger } from "@/app/lib/logger";
import { updateRegistrationPaymentUseCase } from "src/application/use-cases/payments/update-registration-payment.use-case";
import {
  DatabaseOperationError,
  InputParseError,
} from "src/entities/errors/common";
import {
  updateRegistrationPaymentSchema,
  UpdateRegistrationPaymentInput,
} from "src/entities/models/Payment";
import { err, ok } from "src/entities/models/Result";

export const UpdateRegistrationPaymentController = async (
  payment_id: string,
  input: Partial<UpdateRegistrationPaymentInput>,
) => {
  try {
    const { data, error: inputParseError } =
      updateRegistrationPaymentSchema.safeParse(input);

    if (inputParseError) {
      throw new InputParseError("Invalid Data!", {
        cause: inputParseError.flatten().fieldErrors,
      });
    }

    const res = await updateRegistrationPaymentUseCase(payment_id, data);
    return ok(res);
  } catch (error) {
    if (error instanceof InputParseError) {
      logger("UpdateRegistrationPaymentController", error, "warn");
      return err({ message: error.message, cause: error.cause });
    }

    logger("UpdateRegistrationPaymentController", error);
    if (error instanceof DatabaseOperationError) {
      return err({ message: "Server Error", cause: error?.message });
    }

    return err({
      message: "An error occurred! Please contact your admin!",
      cause: "Server Error",
    });
  }
};
