"use client";

import { useState, type ReactNode } from "react";
import {
  AuctionStatusBadge,
  InventoryStatusBadge,
} from "@/app/components/admin";
import { cn } from "@/app/lib/utils";

type Tab = "details" | "activity";

type HistoryItem = {
  inventory_history_id: string;
  auction_status: React.ComponentProps<typeof AuctionStatusBadge>["status"];
  inventory_status: React.ComponentProps<typeof InventoryStatusBadge>["status"];
  receipt_number?: string | null;
  remarks?: string | null;
  created_at: string;
};

type AuctionsInventorySummary = {
  auction_inventory_id?: string;
  price?: number;
  status?: React.ComponentProps<typeof AuctionStatusBadge>["status"];
  manifest_number?: string;
  qty?: string;
  created_at?: string;
  bidder?: { bidder_number: string; full_name: string } | null;
};

interface InventoryProfileViewProps {
  inventory: {
    inventory_id: string;
    barcode: string;
    control: string;
    description: string;
    status: React.ComponentProps<typeof InventoryStatusBadge>["status"];
    is_bought_item: number;
    created_at: string;
    container: { barcode: string };
    histories: HistoryItem[];
    auctions_inventories: AuctionsInventorySummary;
  };
  actions?: ReactNode;
}

const formatPeso = (value: number) =>
  `₱${value.toLocaleString("en-PH", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;

export const InventoryProfileView: React.FC<InventoryProfileViewProps> = ({
  inventory,
  actions,
}) => {
  const [tab, setTab] = useState<Tab>("details");

  const {
    barcode,
    control,
    description,
    status,
    is_bought_item,
    created_at,
    container,
    histories,
    auctions_inventories,
  } = inventory;

  const isBoughtItem = is_bought_item === 1;
  const auctionPrice = auctions_inventories?.price;
  const auctionDate = auctions_inventories?.created_at;
  const auctionStatus = auctions_inventories?.status;
  const manifestNumber = auctions_inventories?.manifest_number;
  const quantity = auctions_inventories?.qty;
  const auctionBidder = auctions_inventories?.bidder ?? null;

  return (
    <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4 border-b px-6 py-5">
        <div className="min-w-0 flex-1">
          <div className="mb-1.5 flex flex-wrap items-center gap-2">
            <span className="rounded bg-secondary px-1.5 py-0.5 text-[14.5px] font-semibold tracking-wider text-secondary-foreground uppercase">
              Inventory Item
            </span>
            <InventoryStatusBadge status={status} size="sm" />
            {auctionStatus ? (
              <AuctionStatusBadge status={auctionStatus} size="sm" />
            ) : null}
            {isBoughtItem ? (
              <span className="text-[15.5px] tracking-wider text-muted-foreground uppercase">
                Bought item
              </span>
            ) : null}
          </div>
          <div className="flex flex-wrap items-baseline gap-3">
            <h2 className="font-mono text-[26px] font-semibold tracking-tight">
              {barcode}
            </h2>
            <span className="text-lg text-muted-foreground">
              {description}
            </span>
          </div>
          <div className="mt-1 font-mono text-sm text-muted-foreground">
            Control {control}
            {manifestNumber ? <> · Manifest {manifestNumber}</> : null}
          </div>
        </div>
        {actions ? <div className="flex shrink-0 gap-2">{actions}</div> : null}
      </div>

      {/* Big stats row */}
      <div className="grid grid-cols-1 border-b md:grid-cols-4">
        <StatCell
          label="Selling price"
          value={auctionPrice != null ? formatPeso(auctionPrice) : "—"}
          sub={auctionPrice == null ? "Not yet sold" : undefined}
          accent
          className="border-b md:border-b-0 md:border-r"
        />
        <StatCell
          label="Bidder"
          value={auctionBidder ? `#${auctionBidder.bidder_number}` : "—"}
          sub={auctionBidder ? auctionBidder.full_name : "No bidder yet"}
          className="border-b md:border-b-0 md:border-r"
        />
        <StatCell
          label="Container"
          value={container.barcode}
          mono
          className="border-b md:border-b-0 md:border-r"
        />
        <StatCell
          label="Auction date"
          value={auctionDate || "—"}
          sub={!auctionDate ? "Not in auction yet" : undefined}
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-0 border-b px-4">
        <TabButton
          active={tab === "details"}
          onClick={() => setTab("details")}
        >
          Details
        </TabButton>
        <TabButton
          active={tab === "activity"}
          onClick={() => setTab("activity")}
          count={histories.length}
        >
          Activity
        </TabButton>
      </div>

      {/* Tab body */}
      <div className="px-6 py-5">
        {tab === "details" ? (
          <div className="grid grid-cols-1 gap-x-7 gap-y-4 md:grid-cols-2">
            <Field label="Barcode" value={barcode} mono />
            <Field label="Control number" value={control} mono />
            <Field label="Container" value={container.barcode} mono />
            <Field label="Description" value={description} />
            {manifestNumber ? (
              <Field label="Manifest" value={manifestNumber} mono />
            ) : null}
            {quantity ? (
              <Field label="Quantity" value={quantity} mono />
            ) : null}
            <Field label="Encoded" value={created_at} />
          </div>
        ) : null}

        {tab === "activity" ? <Timeline histories={histories} /> : null}
      </div>
    </div>
  );
};

const StatCell = ({
  label,
  value,
  sub,
  accent,
  mono = true,
  className,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: boolean;
  mono?: boolean;
  className?: string;
}) => (
  <div className={cn("flex flex-col gap-1 px-6 py-4", className)}>
    <div className="text-[14.5px] font-semibold tracking-wider text-muted-foreground uppercase">
      {label}
    </div>
    <div
      className={cn(
        "text-[22px] font-semibold tracking-tight",
        mono && "font-mono",
        accent ? "text-status-success" : "text-foreground",
      )}
    >
      {value}
    </div>
    {sub ? <div className="text-[15px] text-muted-foreground">{sub}</div> : null}
  </div>
);

const TabButton = ({
  active,
  onClick,
  children,
  count,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
  count?: number;
}) => (
  <button
    type="button"
    onClick={onClick}
    className={cn(
      "-mb-px inline-flex items-center gap-1.5 border-b-2 px-3.5 py-3 text-[15px] font-medium transition-colors",
      active
        ? "border-primary text-foreground"
        : "border-transparent text-muted-foreground hover:text-foreground",
    )}
  >
    {children}
    {count != null ? (
      <span className="rounded-full bg-secondary px-1.5 py-px text-[14.5px] font-semibold text-muted-foreground">
        {count}
      </span>
    ) : null}
  </button>
);

const Field = ({
  label,
  value,
  sub,
  mono,
}: {
  label: string;
  value: string;
  sub?: string;
  mono?: boolean;
}) => (
  <div>
    <div className="mb-1 text-[14.5px] font-semibold tracking-wider text-muted-foreground uppercase">
      {label}
    </div>
    <div className={cn("text-[15.5px] text-foreground", mono && "font-mono")}>
      {value}
    </div>
    {sub ? (
      <div className="mt-0.5 text-[15.5px] text-muted-foreground">{sub}</div>
    ) : null}
  </div>
);

const Timeline = ({ histories }: { histories: HistoryItem[] }) => {
  if (histories.length === 0) {
    return (
      <div className="py-6 text-center text-base text-muted-foreground">
        No activity recorded yet.
      </div>
    );
  }

  return (
    <div>
      {histories.map((history, index) => {
        const isLast = index === histories.length - 1;
        return (
          <div
            key={history.inventory_history_id}
            className={cn(
              "grid grid-cols-[14px_1fr] gap-x-3",
              isLast ? "pb-0" : "pb-4",
            )}
          >
            <div className="relative flex justify-center">
              <div className="mt-1 size-3.5 shrink-0 rounded-full border-2 border-primary bg-primary" />
              {!isLast ? (
                <div className="absolute top-[22px] -bottom-4 left-1/2 w-px -translate-x-1/2 bg-border" />
              ) : null}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <AuctionStatusBadge
                    status={history.auction_status}
                    size="sm"
                  />
                  <InventoryStatusBadge
                    status={history.inventory_status}
                    size="sm"
                  />
                </div>
                <div className="shrink-0 font-mono text-[15px] text-muted-foreground">
                  {history.created_at}
                </div>
              </div>
              {history.receipt_number || history.remarks ? (
                <div className="mt-1 text-[15.5px] text-muted-foreground">
                  {history.receipt_number ? (
                    <>
                      Receipt{" "}
                      <span className="font-mono text-foreground/80">
                        {history.receipt_number}
                      </span>
                    </>
                  ) : null}
                  {history.receipt_number && history.remarks ? " · " : null}
                  {history.remarks}
                </div>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
};
