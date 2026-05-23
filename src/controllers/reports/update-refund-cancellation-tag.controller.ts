import { z } from "zod";
import { ok, err } from "src/entities/models/Result";
import { logger } from "@/app/lib/logger";
import { logActivity } from "@/app/lib/log-activity";
import {
  DatabaseOperationError,
  InputParseError,
} from "src/entities/errors/common";
import { ReportsRepository } from "src/infrastructure/di/repositories";
import {
  CANCEL_REFUND_TAG_LABELS,
  CANCEL_REFUND_TAG_VALUES,
} from "src/entities/models/InventoryHistoryRemark";

const schema = z.object({
  auction_inventory_id: z.string().min(1),
  tag: z.enum(CANCEL_REFUND_TAG_VALUES),
});

export type UpdateRefundCancellationTagInput = z.infer<typeof schema>;

export const UpdateRefundCancellationTagController = async (
  input: Partial<UpdateRefundCancellationTagInput>,
) => {
  try {
    const { data, error: inputParseError } = schema.safeParse(input);
    if (inputParseError) {
      throw new InputParseError("Invalid Data!", {
        cause: inputParseError.flatten().fieldErrors,
      });
    }

    await ReportsRepository.updateRefundCancellationTag(
      data.auction_inventory_id,
      data.tag,
    );

    await logActivity(
      "UPDATE",
      "auction_inventory",
      data.auction_inventory_id,
      `Updated refund/cancellation tag to ${CANCEL_REFUND_TAG_LABELS[data.tag]}`,
    );

    return ok(undefined);
  } catch (error) {
    if (error instanceof InputParseError) {
      logger("UpdateRefundCancellationTagController", error, "warn");
      return err({ message: error.message, cause: error?.cause });
    }
    logger("UpdateRefundCancellationTagController", error);
    if (error instanceof DatabaseOperationError) {
      return err({ message: "Server Error", cause: error.message });
    }
    return err({
      message: "An error occurred! Please contact your admin!",
      cause: "Server Error",
    });
  }
};
