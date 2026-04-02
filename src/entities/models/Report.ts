import { Prisma } from "@prisma/client";

// -- Payment Method Breakdown --
export type PaymentMethodBreakdownRow = {
  payment_method_name: string;
  total_amount: number;
  transaction_count: number;
};

export type PaymentMethodBreakdown = {
  payment_method_name: string;
  total_amount: number;
  transaction_count: number;
};

// -- Daily Cash Flow --
export type DailyCashFlowPaymentRow = {
  created_at: Date;
  purpose: string;
  total_amount: number;
};

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

// -- Sales Reports --
export type AuctionSalesSummaryRow = {
  auction_id: string;
  created_at: Date;
  total_bidders: number;
  total_items: number;
  items_sold: number;
  total_sales: number;
  total_registration_fee: number;
};

// -- Expense Reports --
export type ExpenseSummaryRow = {
  created_at: Date;
  total_amount: number;
};

// -- Bidder Reports --
export type BidderReportRow = {
  bidder_id: string;
  bidder_number: string;
  first_name: string;
  last_name: string;
  status: string;
  auctions_attended: number;
  auctions_with_balance: number;
  items_won: number;
  total_spent: number;
  total_balance: number;
};

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
  barcode: string;
  control: string | null;
  price: number;
  status: string;
  reason: string;
};

export type RefundCancellationBidderEntry = {
  bidder_number: string;
  bidder_name: string;
  refunded: number;
  cancelled: number;
  total: number;
};

// -- Supplier Revenue Summary --
export type SupplierRevenueRow = Prisma.suppliersGetPayload<{
  include: {
    containers: {
      include: {
        inventories: {
          include: {
            auctions_inventory: true;
          };
        };
      };
    };
  };
}>;

export type SupplierRevenueSummaryEntry = {
  supplier_name: string;
  supplier_code: string;
  container_count: number;
  items_sold: number;
  total_revenue: number;
  atc_com: number;
  atc_group_com: number;
};

// -- Container Status Overview --
export type ContainerStatusRow = Prisma.containersGetPayload<{
  include: {
    supplier: true;
    inventories: {
      include: {
        auctions_inventory: true;
      };
    };
  };
}>;

export type ContainerStatusEntry = {
  barcode: string;
  container_number: string | null;
  supplier_name: string;
  status: "PAID" | "UNPAID";
  arrival_date: string | null;
  due_date: string | null;
  days_since_arrival: number | null;
  duties_and_taxes: number;
  total_items: number;
  paid_items: number;
};

// -- Auction Comparison --
export type AuctionComparisonEntry = {
  auction_id: string;
  auction_date: string;
  total_sales: number;
  total_registration_fee: number;
  items_sold: number;
  total_items: number;
  bidder_count: number;
};

// -- Price Comparison (Bought Items) --
export type PriceComparisonRow = Prisma.inventoriesGetPayload<{
  include: {
    auctions_inventory: {
      include: {
        auction_bidder: {
          include: { auctions: true };
        };
      };
    };
  };
}>;

export type PriceComparisonEntry = {
  month: string;
  avg_old_price: number;
  avg_new_price: number;
  item_count: number;
};
