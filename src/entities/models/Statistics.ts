export type UnpaidBidders = {
  bidder_id: string;
  bidder_number: string;
  first_name: string;
  last_name: string;
  auction_date: string;
  balance: number;
  items: number;
};

export type AuctionsStatisticsRow = {
  auction_id: string;
  auction_date: Date;
  total_registered_bidders: number;
  total_items: number;
  total_cancelled_items: number;
  total_refunded_items: number;
  total_bidders_with_balance: number;
  container_barcodes: string;
};

export type AuctionsStatistics = {
  auction_id: string;
  auction_date: string;
  total_registered_bidders: number;
  total_items: number;
  total_cancelled_items: number;
  total_refunded_items: number;
  total_bidders_with_balance: number;
  container_barcodes: string;
};
