export type { BannedBidder } from "./BidderBanHistory";

export type UnpaidBidders = {
  bidder_id: string;
  bidder_number: string;
  first_name: string;
  last_name: string;
  auction_date: string;
  auction_duration: string;
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

export const HOME_CALENDAR_EVENT_TYPES = [
  "AUCTION",
  "CONTAINER_DUE",
  "BIDDER_BIRTHDAY",
] as const;

export type HomeCalendarEventType = (typeof HOME_CALENDAR_EVENT_TYPES)[number];

type HomeCalendarEventBase = {
  id: string;
  title: string;
  start: string;
  allDay: boolean;
  event_type: HomeCalendarEventType;
  backgroundColor: string;
  borderColor: string;
  textColor: string;
};

export type HomeCalendarAuctionEvent = HomeCalendarEventBase & {
  event_type: "AUCTION";
  details: {
    auction_id: string;
    auction_date: string;
    total_registered_bidders: number;
    total_items: number;
    total_cancelled_items: number;
    total_refunded_items: number;
    total_bidders_with_balance: number;
    container_barcodes: string;
    route_path: string;
  };
};

export type HomeCalendarContainerDueEvent = HomeCalendarEventBase & {
  event_type: "CONTAINER_DUE";
  details: {
    container_id: string;
    barcode: string;
    bill_of_lading_number: string;
    container_number: string;
    arrival_date: string;
    due_date: string;
    branch_name: string;
    route_path: string;
  };
};

export type HomeCalendarBidderBirthdayEvent = HomeCalendarEventBase & {
  event_type: "BIDDER_BIRTHDAY";
  details: {
    bidder_id: string;
    bidder_number: string;
    full_name: string;
    birthdate: string;
    age: string;
    last_auction_date: string;
    route_path: string;
  };
};

export type HomeCalendarEvent =
  | HomeCalendarAuctionEvent
  | HomeCalendarContainerDueEvent
  | HomeCalendarBidderBirthdayEvent;
