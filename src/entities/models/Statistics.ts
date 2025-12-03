export type UnpaidBidders = {
  bidder_id: string;
  bidder_number: string;
  first_name: string;
  last_name: string;
  auction_date: string;
  balance: number;
  items: number;
};

/**
 * auction_id: '51bc5bac-0d74-4401-9550-97d470a0083a',
    auction_date: 2025-11-29T00:00:00.000Z,
    total_registered_bidders: 43n,
    total_items: 1185n,
    total_cancelled_items: 5,
    total_refunded_items: 5,
    total_bidders_with_balance: 18n,
    container_barcodes:
 */

export type AuctionsStatisticsSchema = {
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
