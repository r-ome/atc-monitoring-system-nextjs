"use client";

import { useState, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpDown, Package, Receipt as ReceiptIcon } from "lucide-react";
import { safeGetItem } from "@/app/lib/local-storage";
import { AuctionDataTable } from "@/app/(protected)/auctions/components/AuctionDataTable";
import {
  Column,
  ColumnDef,
  CoreRow,
  Row,
  RowSelectionState,
} from "@tanstack/react-table";
import {
  AuctionInventory,
  ManifestNumberDisplay,
  columns,
} from "@/app/(protected)/auctions/[auction_date]/registered-bidders/[bidder_number]/components/auction-inventories-columns";
import { RegisteredBidder } from "src/entities/models/Bidder";
import {
  PaymentPurpose,
  ReceiptRecords,
  REFUND_PURPOSES,
} from "src/entities/models/Payment";
import { ProfileActionButtons } from "@/app/(protected)/auctions/[auction_date]/registered-bidders/[bidder_number]/components/ProfileActionButtons";
import { BidderPullOutModalProvider } from "../context/BidderPullOutModalContext";
import { Checkbox } from "@/app/components/ui/checkbox";
import { AuctionStatusPill } from "@/app/(protected)/auctions/components/AuctionStatusPill";
import { cn, formatDate, formatNumberToCurrency } from "@/app/lib/utils";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/app/components/ui/tabs";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/app/components/ui/popover";

interface BidderItemsTableProps {
  auctionInventories: RegisteredBidder["auction_inventories"];
  registeredBidder: RegisteredBidder;
  receipts: ReceiptRecords[];
}

type ReceiptAuctionInventory = {
  id: string;
  auction_inventory_id: string | null;
  auction_date: string;
  description: string;
  status: AuctionInventory["status"];
  price: number | null;
  qty: string | number | null;
  manifest_number: string | null;
  inventory: {
    barcode: string | null;
    control: string | null;
    status: AuctionInventory["inventory"]["status"];
  };
  receipt: {
    receipt_number?: string | null;
  };
};

export function BidderItemsTable({
  auctionInventories,
  registeredBidder,
  receipts,
}: BidderItemsTableProps) {
  const [selectedRows, setSelectedRows] = useState<RowSelectionState>({});
  const itemReceipts = useMemo(
    () => receipts.filter((receipt) => receipt.auctions_inventories.length > 0),
    [receipts],
  );

  const selectedItems = useMemo(() => {
    const selectedRowsKeys = Object.keys(selectedRows);
    if (!selectedRowsKeys.length)
      return auctionInventories.filter((item) =>
        ["UNPAID", "PARTIAL"].includes(item.status),
      );

    return auctionInventories.filter((item) =>
      selectedRowsKeys.includes(item.auction_inventory_id)
    );
  }, [selectedRows, auctionInventories]);

  const selectLastPrintedReceipt = () => {
    const raw = safeGetItem(registeredBidder?.auction_bidder_id);
    const lastPrinted = raw ? JSON.parse(raw) : [];
    const selection: RowSelectionState = {};
    auctionInventories.forEach((item) => {
      if (lastPrinted.includes(item.auction_inventory_id)) {
        selection[item.auction_inventory_id] = true;
      }
    });

    setSelectedRows(selection);
  };

  const globalFilterFn = (
    row: CoreRow<AuctionInventory>,
    _columnId?: string,
    filterValue?: string
  ) => {
    const search = (filterValue ?? "").toLowerCase();
    const { description, price, manifest_number, inventory } = row.original;
    const { barcode, control } = inventory;

    return [barcode, control, description, manifest_number, price]
      .filter(Boolean)
      .some((field) => field!.toString().toLowerCase().includes(search));
  };

  const router = useRouter();

  const renderMobileCard = (row: Row<AuctionInventory>) => {
    const it = row.original;
    return (
      <div className="flex items-start gap-2.5 px-4 py-3">
        <div
          className="pt-0.5"
          onClick={(e) => e.stopPropagation()}
        >
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Select row"
          />
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex items-baseline gap-1.5">
            <span
              className="font-mono text-[14px] font-semibold underline decoration-dotted underline-offset-2"
              onClick={(e) => {
                e.stopPropagation();
                router.push(
                  `/auctions/${formatDate(
                    new Date(it.auction_date),
                    "yyyy-MM-dd",
                  )}/monitoring/${it.auction_inventory_id}`,
                );
              }}
            >
              {it.inventory.barcode}
            </span>
            <span className="font-mono text-[12.5px] text-muted-foreground">
              · {it.inventory.control}
            </span>
            <span className="ml-auto">
              <AuctionStatusPill status={it.status} />
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="line-clamp-1 text-[15px] font-medium">
              {it.description}
            </span>
            {it.qty ? (
              <span className="font-mono text-[13px] text-muted-foreground">
                ×{it.qty}
              </span>
            ) : null}
            <span className="ml-auto font-mono text-[14.5px] font-semibold">
              {formatNumberToCurrency(it.price)}
            </span>
          </div>
          {it.manifest_number ? (
            <div className="text-[13px] text-muted-foreground">
              Manifest{" "}
              <span className="font-mono font-semibold text-foreground/80">
                <ManifestNumberDisplay manifestNumber={it.manifest_number} />
              </span>
            </div>
          ) : null}
        </div>
      </div>
    );
  };

  return (
    <BidderPullOutModalProvider>
      <Tabs defaultValue="all" className="gap-3">
        <TabsList variant="page">
          <TabsTrigger value="all">All Items</TabsTrigger>
          {itemReceipts.map((receipt) => (
            <TabsTrigger key={receipt.receipt_id} value={receipt.receipt_id}>
              {receipt.receipt_number}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="all" className="mt-0">
          <AuctionDataTable
            icon={Package}
            title="Bidder Items"
            meta={`${auctionInventories.length.toLocaleString()} entries`}
            rowLabel="item"
            columns={columns}
            data={auctionInventories}
            getRowId={(row) => row.auction_inventory_id}
            rowSelection={{
              selectedRows,
              onRowSelectionChange: setSelectedRows,
            }}
            actionButtons={
              <ProfileActionButtons
                selectedItems={selectedItems}
                registeredBidder={registeredBidder}
                selectLastPrintedReceipt={selectLastPrintedReceipt}
              />
            }
            searchFilter={{
              globalFilterFn,
              searchComponentProps: {
                placeholder: "Search item here",
              },
            }}
            columnFilter={{
              column: "auction_status",
              options: [
                { label: "PAID", value: "PAID" },
                { label: "UNPAID", value: "UNPAID" },
              ],
              filterComponentProps: { placeholder: "Filter by status" },
            }}
            renderMobileCard={renderMobileCard}
          />
        </TabsContent>

        {itemReceipts.map((receipt) => (
          <TabsContent
            key={receipt.receipt_id}
            value={receipt.receipt_id}
            className="mt-0"
          >
            <ReceiptItemsTable receipt={receipt} />
          </TabsContent>
        ))}
      </Tabs>
    </BidderPullOutModalProvider>
  );
}

function ReceiptItemsTable({ receipt }: { receipt: ReceiptRecords }) {
  const [receiptSearch, setReceiptSearch] = useState("");
  const router = useRouter();
  const receiptItems = useMemo(
    () =>
      receipt.auctions_inventories.map((item, index) => ({
        id:
          item.auction_inventory_id ??
          `${receipt.receipt_id}-history-${index}`,
        auction_inventory_id: item.auction_inventory_id,
        auction_date: receipt.auction_date,
        description: item.description ?? "No description",
        status: normalizeAuctionStatus(item.auction_status, receipt.purpose),
        price: item.price ?? null,
        qty: item.qty ?? null,
        manifest_number: item.manifest_number ?? null,
        inventory: {
          barcode: item.barcode ?? null,
          control: item.control ?? null,
          status: normalizeInventoryStatus(item.inventory_status),
        },
        receipt: {
          receipt_number: receipt.receipt_number,
        },
      })),
    [receipt],
  );
  const filteredReceiptItems = useMemo(() => {
    const search = receiptSearch.trim().toLowerCase();
    if (!search) return receiptItems;

    return receiptItems.filter((item) =>
      [
        item.inventory.barcode,
        item.inventory.control,
        item.description,
        item.manifest_number,
        item.qty,
        item.price,
      ]
        .filter(Boolean)
        .some((field) => field!.toString().toLowerCase().includes(search)),
    );
  }, [receiptItems, receiptSearch]);
  const displayedItemsPrice = filteredReceiptItems.reduce(
    (sum, item) => sum + (item.price ?? 0),
    0,
  );

  const renderMobileReceiptCard = (row: Row<ReceiptAuctionInventory>) => {
    const it = row.original;
    const hasAuctionItem = !!it.auction_inventory_id;

    return (
      <div className="flex min-w-0 flex-col gap-1 px-4 py-3">
        <div className="flex items-baseline gap-1.5">
          <span
            className={cn(
              "font-mono text-[14px] font-semibold",
              hasAuctionItem &&
                "underline decoration-dotted underline-offset-2",
            )}
            onClick={(e) => {
              if (!it.auction_inventory_id) return;

              e.stopPropagation();
              router.push(
                `/auctions/${formatDate(
                  new Date(it.auction_date),
                  "yyyy-MM-dd",
                )}/monitoring/${it.auction_inventory_id}`,
              );
            }}
          >
            {it.inventory.barcode ?? "-"}
          </span>
          <span className="font-mono text-[12.5px] text-muted-foreground">
            · {it.inventory.control ?? "NC"}
          </span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="line-clamp-1 text-[15px] font-medium">
            {it.description}
          </span>
          {it.qty ? (
            <span className="font-mono text-[13px] text-muted-foreground">
              ×{it.qty}
            </span>
          ) : null}
          <span className="ml-auto font-mono text-[14.5px] font-semibold">
            {it.price ? formatNumberToCurrency(it.price) : "-"}
          </span>
        </div>
        {it.manifest_number ? (
          <div className="text-[13px] text-muted-foreground">
            Manifest{" "}
            <span className="font-mono font-semibold text-foreground/80">
              <ManifestNumberDisplay manifestNumber={it.manifest_number} />
            </span>
          </div>
        ) : null}
      </div>
    );
  };

  return (
    <AuctionDataTable
      icon={ReceiptIcon}
      title={
        <div className="grid min-w-0 flex-1 gap-3 md:grid-cols-[auto_minmax(260px,380px)_1fr] md:items-center md:gap-5">
          <div className="flex min-w-0 items-center gap-3">
            <span className="font-mono text-[16px] font-semibold 2xl:text-[19.5px]">
              {receipt.receipt_number}
            </span>
            <AuctionStatusPill
              status={formatReceiptPurpose(receipt.purpose)}
              size="sm"
              className="shrink-0 whitespace-nowrap"
            />
          </div>
          <Input
            value={receiptSearch}
            onChange={(event) => setReceiptSearch(event.target.value)}
            placeholder="Search item here"
            className="h-8 w-full md:w-[320px] 2xl:w-[380px]"
          />
          <ReceiptTotalBreakdown
            receipt={receipt}
            itemTotal={receiptItems.reduce(
              (sum, item) => sum + (item.price ?? 0),
              0,
            )}
          />
        </div>
      }
      rowLabel="item"
      columns={receiptItemColumns}
      data={filteredReceiptItems}
      getRowId={(row) => row.id}
      renderMobileCard={renderMobileReceiptCard}
      footer={
        <div className="flex items-center justify-end gap-8">
          <span className="caps-label text-[11px]">Item Total</span>
          <span className="font-mono font-semibold">
            {formatNumberToCurrency(displayedItemsPrice)}
          </span>
        </div>
      }
    />
  );
}

function ReceiptTotalBreakdown({
  receipt,
  itemTotal,
}: {
  receipt: ReceiptRecords;
  itemTotal: number;
}) {
  const [open, setOpen] = useState(false);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isRefund = REFUND_PURPOSES.includes(receipt.purpose);
  const serviceChargeRate = receipt.bidder.service_charge;
  const serviceCharge = (itemTotal * serviceChargeRate) / 100;
  const isDashOnePullOut =
    receipt.purpose === "PULL_OUT" &&
    receipt.receipt_number === `${receipt.bidder.bidder_number}-1`;
  const registrationFeeCredit = isDashOnePullOut
    ? receipt.bidder.registration_fee
    : 0;
  const inferredTotal = itemTotal + serviceCharge - registrationFeeCredit;
  const adjustment = receipt.total_amount_paid - inferredTotal;

  const totalClassName = cn(
    "font-mono font-semibold",
    isRefund ? "text-destructive" : "text-status-success",
  );
  const openBreakdown = () => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    setOpen(true);
  };
  const closeBreakdown = () => {
    closeTimerRef.current = setTimeout(() => setOpen(false), 120);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="justify-self-start rounded text-left text-[13px] text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring md:justify-self-end 2xl:text-[16px]"
          onMouseEnter={openBreakdown}
          onMouseLeave={closeBreakdown}
          onClick={() => setOpen((current) => !current)}
        >
          {receipt.auctions_inventories.length.toLocaleString()} item
          {receipt.auctions_inventories.length === 1 ? "" : "s"} ·{" "}
          <span className={totalClassName}>
            {isRefund
              ? `(${formatNumberToCurrency(receipt.total_amount_paid)})`
              : formatNumberToCurrency(receipt.total_amount_paid)}
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-[280px] p-3 text-[13px]"
        onMouseEnter={openBreakdown}
        onMouseLeave={closeBreakdown}
      >
        <div className="space-y-2">
          <div className="font-semibold">Receipt breakdown</div>
          <BreakdownLine label="Item total" value={itemTotal} tone="positive" />
          <BreakdownLine
            label={`Service charge (${serviceChargeRate}%)`}
            value={serviceCharge}
            tone="positive"
          />
          {isDashOnePullOut ? (
            <BreakdownLine
              label="Registration fee"
              value={-registrationFeeCredit}
              tone="deduction"
            />
          ) : null}
          {Math.abs(adjustment) >= 0.01 ? (
            <BreakdownLine
              label="Adjustment"
              value={adjustment}
              tone={adjustment < 0 ? "deduction" : "positive"}
            />
          ) : null}
          <div className="border-t pt-2">
            <BreakdownLine
              label={isRefund ? "Refund total" : "Receipt total"}
              value={receipt.total_amount_paid}
              strong
              negative={isRefund}
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function BreakdownLine({
  label,
  value,
  strong,
  negative,
  tone,
}: {
  label: string;
  value: number;
  strong?: boolean;
  negative?: boolean;
  tone?: "positive" | "deduction";
}) {
  const isDeduction = tone === "deduction" || negative || value < 0;
  const amount = isDeduction
    ? `(${formatNumberToCurrency(Math.abs(value))})`
    : formatNumberToCurrency(value);

  return (
    <div
      className={cn(
        "flex items-center justify-between gap-4",
        strong && "font-semibold",
      )}
    >
      <span className="text-muted-foreground">{label}</span>
      <span
        className={cn(
          "font-mono",
          tone === "positive" && "text-status-success",
          isDeduction && "text-destructive",
        )}
      >
        {amount}
      </span>
    </div>
  );
}

function formatReceiptPurpose(purpose: PaymentPurpose) {
  if (purpose === "PULL_OUT") return "PULL OUT";
  if (purpose === "ADD_ON") return "ADD ON";
  return purpose;
}

function normalizeAuctionStatus(
  status: string | null | undefined,
  purpose: PaymentPurpose,
): AuctionInventory["status"] {
  switch (status) {
    case "PAID":
    case "UNPAID":
    case "CANCELLED":
    case "REFUNDED":
    case "DISCREPANCY":
    case "PARTIAL":
      return status;
    default:
      if (purpose === "REFUNDED") return "REFUNDED";
      if (purpose === "LESS") return "PARTIAL";
      return "PAID";
  }
}

function normalizeInventoryStatus(
  status: string | null | undefined,
): AuctionInventory["inventory"]["status"] {
  switch (status) {
    case "SOLD":
    case "UNSOLD":
    case "BOUGHT_ITEM":
    case "VOID":
      return status;
    default:
      return "SOLD";
  }
}

function SortableHeader<TData>({
  column,
  label,
}: {
  column: Column<TData, unknown>;
  label: string;
}) {
  return (
    <div className="flex justify-center">
      <Button
        variant="ghost"
        className="cursor-pointer"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        {label}
        <ArrowUpDown />
      </Button>
    </div>
  );
}

const receiptItemColumns: ColumnDef<ReceiptAuctionInventory>[] = [
  {
    accessorKey: "barcode",
    accessorFn: (row) => row.inventory.barcode,
    size: 100,
    header: ({ column }) => (
      <SortableHeader column={column} label="Barcode" />
    ),
    cell: ({ row }) => {
      const item = row.original;
      const hasAuctionItem = !!item.auction_inventory_id;

      return (
        <ReceiptBarcodeCell item={item} hasAuctionItem={hasAuctionItem} />
      );
    },
  },
  {
    accessorKey: "control",
    accessorFn: (row) => row.inventory.control,
    size: 100,
    header: ({ column }) => (
      <SortableHeader column={column} label="Control" />
    ),
    cell: ({ getValue }) => (
      <div className="flex justify-center font-mono">
        {getValue<string | null>() ?? "NC"}
      </div>
    ),
  },
  {
    accessorKey: "description",
    header: ({ column }) => (
      <SortableHeader column={column} label="Description" />
    ),
    cell: ({ row }) => (
      <div className="flex justify-center">{row.original.description}</div>
    ),
  },
  {
    accessorKey: "qty",
    size: 100,
    header: ({ column }) => <SortableHeader column={column} label="QTY" />,
    cell: ({ row }) => (
      <div className="flex justify-center font-mono">
        {row.original.qty ?? "-"}
      </div>
    ),
  },
  {
    accessorKey: "price",
    size: 100,
    header: ({ column }) => <SortableHeader column={column} label="Price" />,
    cell: ({ row }) => (
      <div className="flex justify-center font-mono">
        {row.original.price?.toLocaleString() ?? "-"}
      </div>
    ),
  },
  {
    accessorKey: "manifest_number",
    size: 80,
    header: ({ column }) => (
      <SortableHeader column={column} label="Manifest" />
    ),
    cell: ({ row }) => (
      <div className="flex justify-center">
        <ManifestNumberDisplay manifestNumber={row.original.manifest_number} />
      </div>
    ),
  },
];

function ReceiptBarcodeCell({
  item,
  hasAuctionItem,
}: {
  item: ReceiptAuctionInventory;
  hasAuctionItem: boolean;
}) {
  const router = useRouter();

  return (
    <div
      className={cn(
        "flex justify-center font-mono font-semibold",
        hasAuctionItem && "hover:cursor-pointer hover:underline",
      )}
      onClick={() => {
        if (!item.auction_inventory_id) return;

        router.push(
          `/auctions/${formatDate(
            new Date(item.auction_date),
            "yyyy-MM-dd",
          )}/monitoring/${item.auction_inventory_id}`,
        );
      }}
    >
      {item.inventory.barcode ?? "-"}
    </div>
  );
}
