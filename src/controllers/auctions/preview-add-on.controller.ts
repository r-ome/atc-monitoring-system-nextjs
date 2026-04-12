import { previewManifestUseCase } from "src/application/use-cases/auctions/preview-manifest.use-case";
import {
  DatabaseOperationError,
  NotFoundError,
} from "src/entities/errors/common";
import { type ManifestSheetRecord } from "src/entities/models/Manifest";
import { err, ok } from "src/entities/models/Result";

const toManifestSheetRecord = (
  input: Partial<ManifestSheetRecord>,
): ManifestSheetRecord => ({
  BARCODE: String(input.BARCODE ?? ""),
  CONTROL: String(input.CONTROL ?? ""),
  DESCRIPTION: String(input.DESCRIPTION ?? ""),
  BIDDER: String(input.BIDDER ?? ""),
  PRICE: String(input.PRICE ?? ""),
  QTY: String(input.QTY ?? ""),
  MANIFEST: String(input.MANIFEST ?? "ADD ON"),
});

export const PreviewAddOnController = async (
  auction_id: string,
  input: Partial<ManifestSheetRecord>,
) => {
  try {
    const processed = await previewManifestUseCase(auction_id, [
      toManifestSheetRecord(input),
    ]);

    return ok(processed);
  } catch (error) {
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
