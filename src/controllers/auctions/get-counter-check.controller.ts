import { getCounterCheckRecordsUseCase } from "src/application/use-cases/auctions/get-counter-check.use-case";
import { DatabaseOperationError } from "src/entities/errors/common";
import { CounterCheckSchema } from "src/entities/models/CounterCheck";
import { ok, err } from "src/entities/models/Response";
import { formatDate } from "@/app/lib/utils";
import { logger } from "@/app/lib/logger";

function presenter(counter_check: CounterCheckSchema[]) {
  return counter_check.map((item) => ({
    counter_check_id: item.counter_check_id,
    auction_id: item.auction_id,
    control: item.control,
    bidder_number: item.bidder_number,
    price: item.price,
    remarks: item.remarks,
    page: item.page,
    created_at: formatDate(item.created_at, "MMMM dd, yyyy"),
    updated_at: formatDate(item.updated_at, "MMMM dd, yyyy"),
  }));
}

export async function GetCounterCheckController(auction_id: string) {
  try {
    const counter_check_records =
      await getCounterCheckRecordsUseCase(auction_id);
    return ok(presenter(counter_check_records));
  } catch (error) {
    logger("GetCounterCheckController", error);
    if (error instanceof DatabaseOperationError) {
      return err({ message: "Server Error", cause: error.message });
    }

    return err({
      message: "An error occurred! Please contact your admin!",
      cause: "Server Error",
    });
  }
}
