import {
  DatabaseOperationError,
  InputParseError,
  NotFoundError,
} from "src/entities/errors/common";
import { err, ok } from "src/entities/models/Result";
import { updateCounterCheckUseCase } from "src/application/use-cases/auctions/update-counter-check.use-case";
import { logger } from "@/app/lib/logger";
import {
  updateCounterCheckSchema,
  UpdateCounterCheckInput,
  CounterCheckRow,
} from "src/entities/models/CounterCheck";

function presenter(counter_check: CounterCheckRow) {
  return {
    counter_check_id: counter_check.counter_check_id,
    bidder_number: counter_check.bidder_number,
    control: counter_check.control,
    page: counter_check.page,
    price: counter_check.price,
    remarks: counter_check.remarks,
  };
}

export const UpdateCounterCheckController = async (
  counter_check_id: string,
  input: Partial<UpdateCounterCheckInput>,
) => {
  try {
    const { data, error: inputParseError } =
      updateCounterCheckSchema.safeParse(input);

    if (inputParseError) {
      throw new InputParseError("Invalid Data!", {
        cause: inputParseError.flatten().fieldErrors,
      });
    }

    const updated = await updateCounterCheckUseCase(counter_check_id, data);
    return ok(presenter(updated));
  } catch (error) {
    logger("UpdateCounterCheckController", error);
    if (error instanceof InputParseError) {
      return err({ message: error.message, cause: error.cause });
    }

    if (error instanceof NotFoundError) {
      return err({ message: error.message, cause: error.cause });
    }

    if (error instanceof DatabaseOperationError) {
      return err({ message: "Server Error", cause: error.message });
    }

    return err({
      message: "An error occurred! Please contact your admin!",
      cause: "Server Error",
    });
  }
};
