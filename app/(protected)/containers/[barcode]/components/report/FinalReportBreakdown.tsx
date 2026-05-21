"use client";

import { useState } from "react";
import { Info } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/app/components/ui/dialog";
import { Separator } from "@/app/components/ui/separator";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/app/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/app/components/ui/table";
import {
  FinalReportModifications,
  FinalReportTaxDeductionItem,
} from "src/entities/models/Container";
import { computeFinalReportBreakdown } from "./computeFinalReportBreakdown";

type FinalReportBreakdownProps = {
  taxDeductionTotal?: number;
  taxDeductionSource?: "draft" | "persisted" | null;
  taxDeductionItems?: FinalReportTaxDeductionItem[];
  modifications?: FinalReportModifications;
  inventories: {
    auction_date?: string | null;
    sales_allocation?: string | null;
    auctions_inventory: {
      status: string;
      price: number;
      bidder?: { bidder_number?: string | null } | null;
    } | null;
  }[];
};

const EMPTY_MODIFICATIONS: FinalReportModifications = {
  source: null,
  bought_items: [],
  voided_items: [],
  merges: [],
};

function formatPeso(value: number): string {
  return value.toLocaleString("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

type AmountRowTone = "default" | "deduct" | "subtotal" | "ignored" | "muted";

function AmountRow({
  label,
  description,
  value,
  tone = "default",
  operator,
}: {
  label: string;
  description?: string;
  value: number;
  tone?: AmountRowTone;
  operator?: "+" | "−" | "=";
}) {
  const sign = tone === "deduct" && value > 0 ? "−" : "";
  const amount = `${sign}${formatPeso(value)}`;

  const valueClass =
    tone === "subtotal"
      ? "font-semibold tabular-nums text-green-600"
      : tone === "deduct"
        ? "font-medium tabular-nums text-orange-500"
        : tone === "ignored" || tone === "muted"
          ? "font-medium tabular-nums text-muted-foreground"
          : "font-medium tabular-nums";

  return (
    <div className="flex items-start justify-between gap-4 py-1.5 text-sm">
      <span className="flex min-w-0 items-start gap-2">
        <span
          aria-hidden
          className="inline-block w-3 shrink-0 text-center text-sm font-semibold leading-5 text-muted-foreground"
        >
          {operator ?? ""}
        </span>
        <span className="min-w-0">
          <span className="block text-muted-foreground">{label}</span>
          {description ? (
            <span className="mt-0.5 block text-xs leading-snug text-muted-foreground/80">
              {description}
            </span>
          ) : null}
        </span>
      </span>
      <span className={valueClass}>{amount}</span>
    </div>
  );
}

function FormulaTotal({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <>
      <Separator className="my-2" />
      <AmountRow label={label} value={value} tone="subtotal" operator="=" />
    </>
  );
}

function DeductionItemsTable({
  items,
}: {
  items: FinalReportTaxDeductionItem[];
}) {
  return (
    <div className="max-h-[420px] overflow-auto rounded-md border">
      <Table>
        <TableHeader className="sticky top-0 z-10 bg-background">
          <TableRow>
            <TableHead className="h-8 whitespace-nowrap text-xs">Ctrl</TableHead>
            <TableHead className="h-8 text-xs">Description</TableHead>
            <TableHead className="h-8 whitespace-nowrap text-right text-xs">
              Original
            </TableHead>
            <TableHead className="h-8 whitespace-nowrap text-right text-xs">
              New
            </TableHead>
            <TableHead className="h-8 whitespace-nowrap text-right text-xs">
              Deducted
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item, index) => (
            <TableRow key={`${item.control}-${index}`}>
              <TableCell className="py-1 text-xs font-medium">
                {item.control || "—"}
              </TableCell>
              <TableCell className="py-1 text-xs">
                {item.description || (
                  <span className="text-muted-foreground italic">
                    (no description)
                  </span>
                )}
              </TableCell>
              <TableCell className="py-1 text-right text-xs tabular-nums text-muted-foreground line-through">
                {item.original_price.toLocaleString()}
              </TableCell>
              <TableCell className="py-1 text-right text-xs tabular-nums">
                {item.new_price.toLocaleString()}
              </TableCell>
              <TableCell className="py-1 text-right text-xs font-medium tabular-nums text-orange-500">
                −{item.deducted_amount.toLocaleString()}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export const FinalReportBreakdown = ({
  inventories,
  taxDeductionTotal = 0,
  taxDeductionSource = null,
  taxDeductionItems = [],
  modifications = EMPTY_MODIFICATIONS,
}: FinalReportBreakdownProps) => {
  const [modifiedItemsOpen, setModifiedItemsOpen] = useState(false);
  const report = computeFinalReportBreakdown(
    inventories,
    taxDeductionTotal,
  );
  const hasDateLessPaidItems = report.paidWithoutAuctionDateTotal > 0;
  const hasExcludedBidder740 = report.excludedBidder740Total > 0;
  const hasTaxDeductions = report.taxDeductionTotal > 0;
  const sourceLabel =
    taxDeductionSource === "persisted"
      ? "from the last generated Final Report"
      : taxDeductionSource === "draft"
        ? "from the in-progress Tax Step draft"
        : null;
  const itemCount = taxDeductionItems.length;
  const boughtCount = modifications.bought_items.length;
  const voidedCount = modifications.voided_items.length;
  const mergeCount = modifications.merges.length;
  const totalModifications =
    itemCount + boughtCount + voidedCount + mergeCount;
  const hasAnyModifications = totalModifications > 0;
  const modificationsSourceLabel =
    modifications.source === "persisted"
      ? "from the last generated Final Report"
      : modifications.source === "draft"
        ? "from the in-progress builder draft"
        : null;
  const modalSourceLabel = sourceLabel ?? modificationsSourceLabel;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Final Report Total Breakdown</CardTitle>
        <CardDescription>
          Walks through how the Container Sales Report total becomes the
          generated Final Report totals.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="container-sales" className="gap-3">
          <TabsList className="grid h-auto w-full grid-cols-3">
            <TabsTrigger className="px-2 text-xs" value="container-sales">
              Container Sales
            </TabsTrigger>
            <TabsTrigger className="px-2 text-xs" value="original-report">
              Original
            </TabsTrigger>
            <TabsTrigger className="px-2 text-xs" value="modified-report">
              Modified
            </TabsTrigger>
          </TabsList>

          <TabsContent value="container-sales" className="space-y-1">
            <p className="text-xs text-muted-foreground">
              How the Reports tab arrives at the Container Sales Report total.
            </p>
            <AmountRow
              label="All PAID item sales"
              description="Every PAID auction item currently in this container."
              value={report.paidItemSalesTotal}
              operator="+"
            />
            {report.atcAllocatedPaidTotal > 0 ? (
              <AmountRow
                label="Less ATC allocated PAID items"
                description="Tracked separately and not part of the container sales total."
                value={report.atcAllocatedPaidTotal}
                tone="deduct"
                operator="−"
              />
            ) : null}
            <FormulaTotal
              label="Container Sales Report total"
              value={report.reportsTabTotal}
            />
          </TabsContent>

          <TabsContent value="original-report" className="space-y-1">
            <p className="text-xs text-muted-foreground">
              Items the Final Report builder removes before generating the
              Original report.
            </p>
            <AmountRow
              label="Container Sales Report total"
              value={report.reportsTabTotal}
              operator="+"
            />
            {hasDateLessPaidItems ? (
              <AmountRow
                label="Less paid items without auction date"
                description="The Final Report builder only includes rows with auction dates."
                value={report.paidWithoutAuctionDateTotal}
                tone="deduct"
                operator="−"
              />
            ) : null}
            {hasExcludedBidder740 ? (
              <AmountRow
                label="Less Bidder 0740 items"
                description="Bidder 0740 is excluded by the builder settings."
                value={report.excludedBidder740Total}
                tone="deduct"
                operator="−"
              />
            ) : null}
            <FormulaTotal
              label="Original Final Report total"
              value={report.originalFinalReportTotal}
            />
          </TabsContent>

          <TabsContent value="modified-report" className="space-y-1">
            <p className="text-xs text-muted-foreground">
              Per-item New Price changes from the Tax Step lower each item&apos;s
              price; the sum of those reductions is subtracted from the Original
              Final Report total.
            </p>
            <AmountRow
              label="Original Final Report total"
              value={report.originalFinalReportTotal}
              operator="+"
            />
            {hasTaxDeductions ? (
              <AmountRow
                label={`Less Tax Step deductions (${itemCount} item${itemCount === 1 ? "" : "s"})`}
                description={
                  sourceLabel
                    ? `Sum of all New Price reductions ${sourceLabel}.`
                    : "Sum of all New Price reductions in the Tax Step."
                }
                value={report.taxDeductionTotal}
                tone="deduct"
                operator="−"
              />
            ) : (
              <AmountRow
                label="No Tax Step deductions"
                description="Nothing has been deducted in the Tax Step yet — the Modified total equals the Original."
                value={0}
                tone="ignored"
                operator="−"
              />
            )}
            <FormulaTotal
              label="Modified Final Report total"
              value={report.modifiedFinalReportTotal}
            />

            {hasAnyModifications ? (
              <div className="mt-3 flex justify-end">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setModifiedItemsOpen(true)}
                >
                  <Info className="h-3.5 w-3.5" />
                  View {totalModifications} modification
                  {totalModifications === 1 ? "" : "s"}
                </Button>
              </div>
            ) : hasTaxDeductions ? (
              <p className="mt-3 text-xs text-muted-foreground">
                A {formatPeso(report.taxDeductionTotal)} deduction is applied,
                but no per-item breakdown is available.
              </p>
            ) : null}
          </TabsContent>
        </Tabs>
      </CardContent>

      <Dialog open={modifiedItemsOpen} onOpenChange={setModifiedItemsOpen}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Modified Items</DialogTitle>
            <DialogDescription>
              Everything the Final Report builder changed between the Original
              and Modified reports
              {modalSourceLabel ? ` (${modalSourceLabel})` : ""}.
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-[60vh] space-y-5 overflow-y-auto pr-1">
            {hasTaxDeductions && taxDeductionItems.length > 0 ? (
              <ModificationSection
                title="Tax Step price changes"
                count={itemCount}
                summary={
                  <span className="font-semibold tabular-nums text-orange-500">
                    −{formatPeso(report.taxDeductionTotal)}
                  </span>
                }
              >
                <DeductionItemsTable items={taxDeductionItems} />
              </ModificationSection>
            ) : null}

            {boughtCount > 0 ? (
              <ModificationSection
                title="Bought items"
                count={boughtCount}
                description="UNSOLD inventories converted into synthetic BOUGHT_ITEM monitoring rows."
              >
                <BoughtItemsTable items={modifications.bought_items} />
              </ModificationSection>
            ) : null}

            {voidedCount > 0 ? (
              <ModificationSection
                title="Voided items"
                count={voidedCount}
                description="UNSOLD inventories marked VOID and excluded from the report."
              >
                <VoidedItemsTable items={modifications.voided_items} />
              </ModificationSection>
            ) : null}

            {mergeCount > 0 ? (
              <ModificationSection
                title="Merged items"
                count={mergeCount}
                description="UNSOLD three-part inventories merged into a SOLD two-part row's auction record."
              >
                <MergesTable items={modifications.merges} />
              </ModificationSection>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

function ModificationSection({
  title,
  count,
  description,
  summary,
  children,
}: {
  title: string;
  count: number;
  description?: string;
  summary?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-2">
      <div className="flex items-baseline justify-between gap-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {title}{" "}
            <span className="ml-1 font-normal normal-case tracking-normal text-muted-foreground/80">
              ({count} item{count === 1 ? "" : "s"})
            </span>
          </p>
          {description ? (
            <p className="mt-0.5 text-xs leading-snug text-muted-foreground/80">
              {description}
            </p>
          ) : null}
        </div>
        {summary ? <div className="text-sm">{summary}</div> : null}
      </div>
      {children}
    </section>
  );
}

function BoughtItemsTable({
  items,
}: {
  items: FinalReportModifications["bought_items"];
}) {
  return (
    <div className="overflow-auto rounded-md border">
      <Table>
        <TableHeader className="bg-background">
          <TableRow>
            <TableHead className="h-8 whitespace-nowrap text-xs">Ctrl</TableHead>
            <TableHead className="h-8 text-xs">Description</TableHead>
            <TableHead className="h-8 whitespace-nowrap text-xs">
              Bidder
            </TableHead>
            <TableHead className="h-8 whitespace-nowrap text-xs">
              Auction date
            </TableHead>
            <TableHead className="h-8 whitespace-nowrap text-right text-xs">
              Qty
            </TableHead>
            <TableHead className="h-8 whitespace-nowrap text-right text-xs">
              Price
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item, index) => (
            <TableRow key={`${item.barcode}-${item.control}-${index}`}>
              <TableCell className="py-1 text-xs font-medium">
                {item.control || "—"}
              </TableCell>
              <TableCell className="py-1 text-xs">
                {item.description || (
                  <span className="text-muted-foreground italic">
                    (no description)
                  </span>
                )}
              </TableCell>
              <TableCell className="py-1 text-xs">
                {item.bidder_number || "—"}
              </TableCell>
              <TableCell className="py-1 text-xs">
                {item.auction_date || "—"}
              </TableCell>
              <TableCell className="py-1 text-right text-xs tabular-nums">
                {item.qty || "—"}
              </TableCell>
              <TableCell className="py-1 text-right text-xs tabular-nums">
                {item.price.toLocaleString()}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function VoidedItemsTable({
  items,
}: {
  items: FinalReportModifications["voided_items"];
}) {
  return (
    <div className="overflow-auto rounded-md border">
      <Table>
        <TableHeader className="bg-background">
          <TableRow>
            <TableHead className="h-8 whitespace-nowrap text-xs">Ctrl</TableHead>
            <TableHead className="h-8 text-xs">Description</TableHead>
            <TableHead className="h-8 whitespace-nowrap text-xs">
              Barcode
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item, index) => (
            <TableRow key={`${item.barcode}-${item.control}-${index}`}>
              <TableCell className="py-1 text-xs font-medium">
                {item.control || "—"}
              </TableCell>
              <TableCell className="py-1 text-xs">
                {item.description || (
                  <span className="text-muted-foreground italic">
                    (no description)
                  </span>
                )}
              </TableCell>
              <TableCell className="py-1 text-xs text-muted-foreground">
                {item.barcode || "—"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function MergesTable({
  items,
}: {
  items: FinalReportModifications["merges"];
}) {
  return (
    <div className="overflow-auto rounded-md border">
      <Table>
        <TableHeader className="bg-background">
          <TableRow>
            <TableHead className="h-8 text-xs">UNSOLD (kept)</TableHead>
            <TableHead className="h-8 text-xs">SOLD source (merged from)</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((m, index) => (
            <TableRow key={`merge-${index}`}>
              <TableCell className="py-1 text-xs">
                <div className="font-medium">{m.unsold.control || "—"}</div>
                <div className="text-muted-foreground">
                  {m.unsold.description || (
                    <span className="italic">(no description)</span>
                  )}
                </div>
                <div className="text-[10px] text-muted-foreground/80">
                  {m.unsold.barcode}
                </div>
              </TableCell>
              <TableCell className="py-1 text-xs">
                <div className="font-medium">{m.sold.control || "—"}</div>
                <div className="text-muted-foreground">
                  {m.sold.description || (
                    <span className="italic">(no description)</span>
                  )}
                </div>
                <div className="text-[10px] text-muted-foreground/80">
                  {m.sold.barcode}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
