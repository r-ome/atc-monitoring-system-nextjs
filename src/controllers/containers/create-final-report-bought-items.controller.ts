import { logger } from "@/app/lib/logger";
import { logActivity } from "@/app/lib/log-activity";
import { RequestContext } from "@/app/lib/prisma/RequestContext";
import {
  DatabaseOperationError,
  InputParseError,
  NotFoundError,
} from "src/entities/errors/common";
import {
  createFinalReportBoughtItemsSchema,
  type CreateFinalReportBoughtItemsInput,
} from "src/entities/models/FinalReport";
import { err, ok } from "src/entities/models/Result";
import { uploadBoughtItemsUseCase } from "src/application/use-cases/inventories/upload-bought-items.use-case";

export const CreateFinalReportBoughtItemsController = async (
  input: Partial<CreateFinalReportBoughtItemsInput>,
) => {
  const ctx = RequestContext.getStore();

  try {
    const { data, error: inputParseError } =
      createFinalReportBoughtItemsSchema.safeParse(input);

    if (inputParseError) {
      throw new InputParseError("Invalid Data!", {
        cause: inputParseError.flatten().fieldErrors,
      });
    }

    await uploadBoughtItemsUseCase(
      data.branch_id,
      data.items.map((item) => ({
        BARCODE: item.barcode,
        CONTROL: item.control,
        DESCRIPTION: item.description,
        OLD_PRICE: String(item.price),
        NEW_PRICE: "",
      })),
      ctx?.username,
    );

    await logActivity(
      "CREATE",
      "bought_item",
      "bulk",
      `Created ${data.items.length} bought item(s) from final report workbench`,
    );

    return ok({ count: data.items.length });
  } catch (error) {
    if (error instanceof InputParseError || error instanceof NotFoundError) {
      logger("CreateFinalReportBoughtItemsController", error, "warn");
      return err({ message: error.message, cause: error.cause });
    }

    logger("CreateFinalReportBoughtItemsController", error);
    if (error instanceof DatabaseOperationError) {
      return err({ message: "Server Error", cause: error.message });
    }

    return err({
      message: "An error occurred! Please contact your admin!",
      cause: "Server Error",
    });
  }
};
