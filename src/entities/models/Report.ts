import { Prisma } from "@prisma/client";

// -- Payment Method Breakdown --
export type PaymentMethodBreakdownRow = Prisma.paymentsGetPayload<{
  include: {
    payment_method: true;
    receipt: {
      include: {
        auction_bidder: { include: { auctions: { include: { branch: true } } } };
      };
    };
  };
}>;

export type PaymentMethodBreakdown = {
  payment_method_name: string;
  total_amount: number;
  transaction_count: number;
};

// -- Daily Cash Flow --
export type DailyCashFlowPaymentRow = Prisma.receipt_recordsGetPayload<{
  include: {
    payments: { include: { payment_method: true } };
    auction_bidder: { include: { auctions: true } };
  };
}>;

export type CashFlowEntry = {
  date: string;
  inflow_registration: number;
  inflow_pull_out: number;
  inflow_add_on: number;
  outflow_refunded: number;
  outflow_less: number;
  outflow_expenses: number;
  net: number;
};

export type FilterMode = "monthly" | "daily";

// -- Bidder Reports --
export type BidderReportRow = Prisma.biddersGetPayload<{
  include: {
    branch: true;
    auctions_joined: {
      include: {
        auctions: true;
        auctions_inventories: true;
        receipt_records: { include: { payments: true } };
      };
    };
  };
}>;

export type UnpaidBidderEntry = {
  bidder_id: string;
  bidder_number: string;
  full_name: string;
  total_balance: number;
  auctions_with_balance: number;
};

export type BidderActivityEntry = {
  bidder_id: string;
  bidder_number: string;
  full_name: string;
  status: string;
  auctions_attended: number;
  items_won: number;
  total_spent: number;
};

export type TopBidderEntry = {
  bidder_id: string;
  bidder_number: string;
  full_name: string;
  total_spent: number;
  items_won: number;
  auctions_attended: number;
};

// -- Inventory Reports --
export type SellThroughRow = Prisma.auctions_inventoriesGetPayload<{
  include: {
    auction_bidder: { include: { auctions: true } };
    inventory: { include: { container: { include: { supplier: true } } } };
  };
}>;

export type SellThroughEntry = {
  auction_id: string;
  auction_date: string;
  total: number;
  paid: number;
  unpaid: number;
  partial: number;
  cancelled: number;
  refunded: number;
  discrepancy: number;
  sell_through_rate: number;
};

export type RefundCancellationRow = Prisma.auctions_inventoriesGetPayload<{
  include: {
    auction_bidder: { include: { bidder: true; auctions: true } };
    inventory: true;
    histories: {
      include: {
        receipt: {
          include: {
            auction_bidder: { include: { bidder: true } };
          };
        };
      };
    };
  };
}>;

export type RefundCancellationEntry = {
  auction_inventory_id: string;
  auction_date: string;
  bidder_number: string;
  bidder_name: string;
  description: string;
  price: number;
  status: string;
};
