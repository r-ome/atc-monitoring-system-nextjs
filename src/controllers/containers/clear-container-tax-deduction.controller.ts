import { logger } from "@/app/lib/logger";
import { logActivity } from "@/app/lib/log-activity";
import {
  DatabaseOperationError,
  InputParseError,
  NotFoundError,
} from "src/entities/errors/common";
import {
  clearContainerTaxDeductionSchema,
  type ClearContainerTaxDeductionInput,
} from "src/entities/models/FinalReport";
import { err, ok } from "src/entities/models/Result";
import { ContainerRepository } from "src/infrastructure/di/repositories";

export const ClearContainerTaxDeductionController = async (
  input: Partial<ClearContainerTaxDeductionInput>,
) => {
  try {
    const { data, error: inputParseError } =
      clearContainerTaxDeductionSchema.safeParse(input);

    if (inputParseError) {
      throw new InputParseError("Invalid Data!", {
        cause: inputParseError.flatten().fieldErrors,
      });
    }

    await ContainerRepository.clearContainerTaxDeduction(data.container_id);

    await logActivity(
      "UPDATE",
      "container",
      data.container_id,
      `Cleared container tax deduction`,
    );

    return ok({ container_id: data.container_id });
  } catch (error) {
    if (error instanceof InputParseError || error instanceof NotFoundError) {
      logger("ClearContainerTaxDeductionController", error, "warn");
      return err({ message: error.message, cause: error.cause });
    }

    logger("ClearContainerTaxDeductionController", error);
    if (error instanceof DatabaseOperationError) {
      return err({ message: "Server Error", cause: error.message });
    }

    return err({
      message: "An error occurred! Please contact your admin!",
      cause: "Server Error",
    });
  }
};
