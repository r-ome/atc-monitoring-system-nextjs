import { AuctionRepository } from "src/infrastructure/repositories/auctions.repository";
import { CounterCheckRecord } from "src/entities/models/CounterCheck";
import {
  removeCounterCheckDuplicates,
  validateEmptyFields,
} from "@/app/lib/sheets";
import { getCounterCheckRecordsUseCase } from "./get-counter-check.use-case";

export const uploadCounterCheckUseCase = async (
  auction_id: string,
  data: CounterCheckRecord[]
) => {
  // const counter_check_records = await getCounterCheckRecordsUseCase(auction_id);
  // const something = validateEmptyFields(data, "counter_check");
  // const something1 = removeCounterCheckDuplicates(
  //   something,
  //   counter_check_records
  // );
  // return await AuctionRepository.uploadCounterCheck(auction_id, something1);
};
