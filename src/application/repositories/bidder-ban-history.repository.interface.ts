import type {
  BidderBanHistoryRow,
  CreateBanHistoryInput,
} from "src/entities/models/BidderBanHistory";

export interface IBidderBanHistoryRepository {
  create(
    bidder_id: string,
    input: CreateBanHistoryInput,
  ): Promise<BidderBanHistoryRow>;
  delete(bidder_ban_history_id: string): Promise<void>;
}
