import { logger } from "@/app/lib/logger";
import { formatDate } from "@/app/lib/utils";
import { getManifestRecordsUseCase } from "src/application/use-cases/auctions/get-manifest-records.use-case";
import { DatabaseOperationError } from "src/entities/errors/common";
import { ManifestSchema } from "src/entities/models/Manifest";
import { ok, err } from "src/entities/models/Response";

function presenter(manifest_records: ManifestSchema[]) {
  return manifest_records.map((manifest) => ({
    manifest_id: manifest.manifest_id,
    auction_id: manifest.auction_id,
    barcode: manifest.barcode,
    control: manifest.control,
    description: manifest.description,
    price: manifest.price,
    bidder_number: manifest.bidder_number,
    qty: manifest.qty,
    manifest_number: manifest.manifest_number,
    remarks: manifest.remarks,
    error_message: manifest.error_message,
    created_at: formatDate(manifest.created_at, "MMMM dd, yyyy HH:mm:ss"),
  }));
}

export const GetManifestRecordsController = async (auctionId: string) => {
  try {
    const manifest_records = await getManifestRecordsUseCase(auctionId);
    return ok(presenter(manifest_records));
  } catch (error) {
    logger("GetManifestRecordsController", error);
    if (error instanceof DatabaseOperationError) {
      return err({ message: "Server Error", cause: error.message });
    }

    return err({
      message: "An error occurred! Please contact your admin!",
      cause: "Server Error",
    });
  }
};
