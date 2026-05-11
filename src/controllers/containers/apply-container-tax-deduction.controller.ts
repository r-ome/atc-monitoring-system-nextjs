import { logger } from "@/app/lib/logger";
import { logActivity } from "@/app/lib/log-activity";
import { RequestContext } from "@/app/lib/prisma/RequestContext";
import {
  DatabaseOperationError,
  InputParseError,
  NotFoundError,
} from "src/entities/errors/common";
import {
  applyContainerTaxDeductionSchema,
  type ApplyContainerTaxDeductionInput,
  type ContainerTaxDeductionRecord,
} from "src/entities/models/FinalReport";
import { err, ok } from "src/entities/models/Result";
import { ContainerRepository } from "src/infrastructure/di/repositories";

export const ApplyContainerTaxDeductionController = async (
  input: Partial<ApplyContainerTaxDeductionInput>,
) => {
  const ctx = RequestContext.getStore();

  try {
    const { data, error: inputParseError } =
      applyContainerTaxDeductionSchema.safeParse(input);

    if (inputParseError) {
      throw new InputParseError("Invalid Data!", {
        cause: inputParseError.flatten().fieldErrors,
      });
    }

    const record: ContainerTaxDeductionRecord = {
      applied_at: new Date().toISOString(),
      applied_by: ctx?.username ?? null,
      options: data.options,
      items: data.items,
    };

    await ContainerRepository.setContainerTaxDeduction(
      data.container_id,
      record,
    );

    await logActivity(
      "UPDATE",
      "container",
      data.container_id,
      `Applied container tax deduction (${data.items.length} item(s))`,
    );

    return ok({ container_id: data.container_id });
  } catch (error) {
    if (error instanceof InputParseError || error instanceof NotFoundError) {
      logger("ApplyContainerTaxDeductionController", error, "warn");
      return err({ message: error.message, cause: error.cause });
    }

    logger("ApplyContainerTaxDeductionController", error);
    if (error instanceof DatabaseOperationError) {
      return err({ message: "Server Error", cause: error.message });
    }

    return err({
      message: "An error occurred! Please contact your admin!",
      cause: "Server Error",
    });
  }
};
