"use client";

import { useMemo } from "react";
import { ArrowRight, Check, Container as ContainerIcon, Sparkles } from "lucide-react";
import { Card } from "@/app/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/app/components/ui/table";
import { formatNumberPadding } from "@/app/lib/utils";
import { StepHeading } from "../shared/StepHeading";
import { peso } from "../shared/format";
import type { V2StepProps } from "../shared/types";

export const AppendStep = (props: V2StepProps) => {
  if (!props.preview) {
    return <div className="p-7 text-sm text-muted-foreground">Loading…</div>;
  }
  return <AppendStepBody {...props} preview={props.preview} />;
};

type AppendBodyProps = V2StepProps & {
  preview: NonNullable<V2StepProps["preview"]>;
};

const AppendStepBody = ({ preview }: AppendBodyProps) => {
  // V2Wizard auto-stages every appendable row centrally as soon as the
  // draft loads and a preview is available, so this step is purely a
  // confirmation view. No write happens here — that way rail jumps that
  // skip this step still produce a correctly staged draft.
  const appendable = useMemo(
    () => preview.appendable_unsold_items,
    [preview.appendable_unsold_items],
  );

  const containerBarcode = preview.sheet_details.barcode;
  const baseSuffix = preview.next_append_suffix;
  const lastBarcode =
    baseSuffix > 0
      ? `${containerBarcode}-${formatNumberPadding(baseSuffix - 1, 3)}`
      : "—";
  const nextAssigned = `${containerBarcode}-${formatNumberPadding(baseSuffix, 3)}`;
  const lastAssigned =
    appendable.length > 0
      ? `${containerBarcode}-${formatNumberPadding(baseSuffix + appendable.length - 1, 3)}`
      : nextAssigned;

  if (appendable.length === 0) {
    return (
      <div className="mx-auto w-full max-w-[1100px] p-7">
        <StepHeading
          n={4}
          title="Append remaining items into this container"
          sub="These items were sold at auction but were encoded as two-part barcodes. We'll give each one a new three-part barcode so they're tracked under this container."
        />
        <Card className="mx-auto max-w-[520px] py-12 text-center">
          <div className="mx-auto mb-3.5 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
            <Check size={26} />
          </div>
          <h2 className="mb-1.5 text-[18px] font-semibold tracking-[-0.01em]">
            No items to append
          </h2>
          <p className="mx-auto mb-4 max-w-[380px] text-[13px] leading-relaxed text-muted-foreground">
            Every sold item in this container already has a proper three-part
            barcode. You can skip ahead to preview the final report.
          </p>
          <div className="inline-flex items-center gap-1.5 text-[11.5px] text-muted-foreground">
            <ContainerIcon size={12} /> Last barcode in container:{" "}
            <span className="font-mono font-semibold text-foreground/80">
              {lastBarcode}
            </span>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1100px] p-7">
      <StepHeading
        n={4}
        title="Append remaining items into this container"
        sub="These items were sold at auction but were encoded as two-part barcodes. We'll give each one a new three-part barcode so they're tracked under this container."
      />

      {/* Summary card */}
      <Card className="mb-3.5 flex flex-row items-center justify-between gap-3.5 p-[18px]">
        <div className="flex items-center gap-3.5">
          <div className="flex h-[38px] w-[38px] items-center justify-center rounded-md bg-primary/10 text-primary">
            <ContainerIcon size={18} />
          </div>
          <div>
            <div className="text-[13.5px] font-semibold">
              {appendable.length} two-part item
              {appendable.length === 1 ? "" : "s"} will be appended to this
              container
            </div>
            <div className="mt-px text-[12px] text-muted-foreground">
              Each one gets the next available three-part barcode, in the order
              shown below.
            </div>
          </div>
        </div>
        <div className="flex gap-[18px] text-[12px]">
          <div>
            <div className="text-[10.5px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
              Last barcode
            </div>
            <div className="mt-0.5 font-mono font-semibold">{lastBarcode}</div>
          </div>
          <div className="w-px bg-border" />
          <div>
            <div className="text-[10.5px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
              Next assigned
            </div>
            <div className="mt-0.5 font-mono font-semibold text-primary">
              {nextAssigned}
            </div>
          </div>
        </div>
      </Card>

      <Card className="overflow-hidden p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[110px]">Old barcode</TableHead>
              <TableHead className="w-[90px]">Control</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="w-[80px]">Bidder</TableHead>
              <TableHead className="w-[50px] text-center">Qty</TableHead>
              <TableHead className="w-[100px] text-right">Price</TableHead>
              <TableHead className="w-[30px]" />
              <TableHead className="w-[130px]">New barcode</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {appendable.map((item, idx) => {
              const auction = item.auctions_inventory;
              const newBarcode = `${containerBarcode}-${formatNumberPadding(
                baseSuffix + idx,
                3,
              )}`;
              return (
                <TableRow key={item.inventory_id}>
                  <TableCell className="font-mono text-[12.5px] text-muted-foreground">
                    {item.barcode}
                  </TableCell>
                  <TableCell className="font-mono text-[12.5px] text-muted-foreground">
                    {item.control}
                  </TableCell>
                  <TableCell className="text-[13px]">
                    {item.description}
                  </TableCell>
                  <TableCell className="font-mono text-[12.5px]">
                    {auction?.auction_bidder?.bidder_number ?? "—"}
                  </TableCell>
                  <TableCell className="text-center font-mono text-[12.5px]">
                    {auction?.qty ?? "—"}
                  </TableCell>
                  <TableCell className="text-right font-mono text-[12.5px]">
                    {auction?.price != null
                      ? auction.price.toLocaleString()
                      : "—"}
                  </TableCell>
                  <TableCell className="text-center text-muted-foreground">
                    <ArrowRight size={14} />
                  </TableCell>
                  <TableCell className="font-mono text-[12.5px] font-semibold text-primary">
                    {newBarcode}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        <div className="flex items-center justify-between border-t px-4 py-2.5 text-[12px] text-muted-foreground">
          <span>
            Appending {appendable.length} items as{" "}
            <span className="font-mono font-medium text-foreground/80">
              {nextAssigned}
            </span>{" "}
            →{" "}
            <span className="font-mono font-medium text-foreground/80">
              {lastAssigned}
            </span>
          </span>
          <span>Numbering is automatic, in encode order.</span>
        </div>
      </Card>

      <div className="mt-3.5 flex items-start gap-2.5 rounded-[10px] bg-primary/10 px-4 py-3.5 text-[12.5px] leading-relaxed text-foreground/90">
        <Sparkles size={16} className="mt-[2px] shrink-0 text-primary" />
        <span>
          These new barcodes only exist once you finalize. The original two-part
          records stay in the auction log for traceability.{" "}
          <span className="text-muted-foreground">
            Total: {peso(appendable.reduce(
              (sum, i) => sum + (i.auctions_inventory?.price ?? 0),
              0,
            ))}
          </span>
        </span>
      </div>
    </div>
  );
};
