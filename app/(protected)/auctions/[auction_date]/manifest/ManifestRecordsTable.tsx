"use client";

import { useState, useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AuctionDataTable } from "@/app/(protected)/auctions/components/AuctionDataTable";
import { CoreRow, Row } from "@tanstack/react-table";
import { columns } from "./manifest-columns";
import { Manifest } from "src/entities/models/Manifest";
import { UpdateManifestModal } from "./UpdateManifestModal";
import {
  buildGroupIndexMap,
  cn,
  formatNumberToCurrency,
} from "@/app/lib/utils";
import { Button } from "@/app/components/ui/button";
import { Card } from "@/app/components/ui/card";
import { AlertCircle, RefreshCw, FileText, X } from "lucide-react";

type EncoderMode = "encoded" | "errors";
type EncoderFilter = { name: string; mode: EncoderMode } | null;

const isTwoPartBarcode = (barcode: string | null) => {
  if (!barcode) return false;
  const parts = barcode.trim().split("-");
  return parts.length === 2 && parts.every((part) => part.trim().length > 0);
};

interface ManifestRecordsTableProps {
  manifestRecords: Manifest[];
  canDeleteFailedRecords: boolean;
}

export const ManifestRecordsTable = ({
  manifestRecords,
  canDeleteFailedRecords,
}: ManifestRecordsTableProps) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selected, setSelected] = useState<Manifest>({
    manifest_id: "",
    barcode: "",
    control: "",
    description: "",
    price: "",
    bidder_number: "",
    qty: "",
    manifest_number: "",
  } as Manifest);
  const [open, setOpen] = useState<boolean>(false);
  const [errorsOnly, setErrorsOnly] = useState(false);
  const [encoderFilter, setEncoderFilter] = useState<EncoderFilter>(null);
  const [slashedOnly, setSlashedOnly] = useState(false);
  const [twoPartOnly, setTwoPartOnly] = useState(false);

  // These table-level filters are mutually exclusive to keep the result set clear.
  const toggleErrorsOnly = () => {
    setEncoderFilter(null);
    setSlashedOnly(false);
    setTwoPartOnly(false);
    setErrorsOnly((v) => !v);
  };
  const toggleEncoderFilter = (name: string, mode: EncoderMode) => {
    setErrorsOnly(false);
    setSlashedOnly(false);
    setTwoPartOnly(false);
    setEncoderFilter((current) =>
      current && current.name === name && current.mode === mode
        ? null
        : { name, mode },
    );
  };
  const toggleSlashedOnly = () => {
    setErrorsOnly(false);
    setEncoderFilter(null);
    setTwoPartOnly(false);
    setSlashedOnly((v) => !v);
  };
  const toggleTwoPartOnly = () => {
    setErrorsOnly(false);
    setEncoderFilter(null);
    setSlashedOnly(false);
    setTwoPartOnly((v) => !v);
  };

  const groupIndexMap = useMemo(
    () => buildGroupIndexMap(manifestRecords, (r) => r.is_slash_item),
    [manifestRecords]
  );

  const globalFilterFn = (
    row: CoreRow<Manifest>,
    _columnId?: string,
    filterValue?: string
  ) => {
    const search = (filterValue ?? "").toLowerCase();
    const {
      bidder_number,
      barcode,
      control,
      description,
      price,
      manifest_number,
      is_slash_item,
    } = row.original;
    const slashGroupIndex = is_slash_item
      ? groupIndexMap[is_slash_item]
      : undefined;
    const slashGroupLabel = slashGroupIndex
      ? `A${slashGroupIndex}`
      : undefined;

    return [
      bidder_number,
      barcode,
      control,
      description,
      manifest_number,
      price,
      slashGroupLabel,
      slashGroupLabel ? `(${slashGroupLabel})` : undefined,
      control && slashGroupLabel ? `${control}(${slashGroupLabel})` : undefined,
    ]
      .filter(Boolean)
      .some((field) => field!.toLowerCase().includes(search));
  };

  const encoderStats = useMemo(() => {
    const byEncoder = new Map<string, { encoded: number; errors: number }>();
    for (const record of manifestRecords) {
      const name = record.remarks?.trim() || "Unknown";
      const entry = byEncoder.get(name) ?? { encoded: 0, errors: 0 };
      if (record.error_message?.trim()) {
        entry.errors += 1;
      } else {
        entry.encoded += 1;
      }
      byEncoder.set(name, entry);
    }
    const encoders = Array.from(byEncoder.entries())
      .map(([name, counts]) => ({ name, ...counts }))
      .sort((a, b) => b.errors - a.errors || a.name.localeCompare(b.name));
    const totalErrors = encoders.reduce((s, e) => s + e.errors, 0);
    return { encoders, totalErrors };
  }, [manifestRecords]);

  const tableData = useMemo(() => {
    const base = manifestRecords.filter(
      (item) => item.barcode && !item.barcode?.match(/barcode/gi),
    );
    if (slashedOnly) {
      return base.filter((item) => item.is_slash_item);
    }
    if (twoPartOnly) {
      return base.filter((item) => isTwoPartBarcode(item.barcode));
    }
    if (encoderFilter) {
      return base.filter((item) => {
        const name = item.remarks?.trim() || "Unknown";
        if (name !== encoderFilter.name) return false;
        const isError = !!item.error_message?.trim();
        return encoderFilter.mode === "errors" ? isError : !isError;
      });
    }
    if (errorsOnly) {
      return base.filter((item) => item.error_message?.trim());
    }
    return base;
  }, [manifestRecords, errorsOnly, encoderFilter, slashedOnly, twoPartOnly]);

  const slashedCount = useMemo(
    () => manifestRecords.filter((m) => m.is_slash_item).length,
    [manifestRecords]
  );
  const twoPartCount = useMemo(
    () => manifestRecords.filter((m) => isTwoPartBarcode(m.barcode)).length,
    [manifestRecords]
  );

  const titleSuffix = encoderFilter
    ? ` · ${encoderFilter.name} (${encoderFilter.mode})`
    : "";

  return (
    <>
      <UpdateManifestModal
        open={open}
        setOpen={setOpen}
        selected={selected}
        canDeleteFailedRecord={canDeleteFailedRecords}
      />

      {encoderStats.encoders.length > 0 ? (
        <Card className="flex flex-col gap-2.5 p-[14px] 2xl:p-4 2xl:text-[17px]">
          <div className="flex items-center justify-between">
            <span className="caps-label text-[13px] 2xl:text-[15px]">
              Encoders Today
            </span>
            <span className="text-[13px] text-muted-foreground 2xl:text-[15.5px]">
              {encoderStats.encoders.length} encoder
              {encoderStats.encoders.length === 1 ? "" : "s"}
              {encoderStats.totalErrors > 0
                ? ` · ${encoderStats.totalErrors.toLocaleString()} total error${
                    encoderStats.totalErrors === 1 ? "" : "s"
                  }`
                : ""}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {encoderStats.encoders.map((e) => {
              const hasErrors = e.errors > 0;
              const initials = e.name
                .split(" ")
                .slice(0, 2)
                .map((s) => s[0])
                .join("")
                .toUpperCase();
              const isEncodedActive =
                encoderFilter?.name === e.name &&
                encoderFilter?.mode === "encoded";
              const isErrorsActive =
                encoderFilter?.name === e.name &&
                encoderFilter?.mode === "errors";
              return (
                <div
                  key={e.name}
                  className={cn(
                    "flex items-center gap-2 rounded-full border px-2.5 py-1 text-[14.5px] transition-colors 2xl:text-[16px]",
                    hasErrors
                      ? "border-destructive/30 bg-destructive/10"
                      : "border-border bg-card",
                    isEncodedActive && "ring-2 ring-primary ring-offset-1",
                    isErrorsActive && "ring-2 ring-destructive ring-offset-1",
                  )}
                >
                  <button
                    type="button"
                    onClick={() => toggleEncoderFilter(e.name, "encoded")}
                    className="flex cursor-pointer items-center gap-2"
                    aria-pressed={isEncodedActive}
                    aria-label={`Filter to records encoded by ${e.name}`}
                  >
                    <span
                      className={cn(
                        "flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full text-[11.5px] font-bold",
                        hasErrors
                          ? "bg-destructive text-destructive-foreground"
                          : "bg-accent text-accent-foreground",
                      )}
                    >
                      {initials}
                    </span>
                    <span
                      className={cn(
                        "font-semibold",
                        hasErrors ? "text-destructive" : "text-foreground",
                      )}
                    >
                      {e.name}
                    </span>
                    <span className="font-mono text-[13.5px] text-muted-foreground 2xl:text-[15.5px]">
                      {e.encoded.toLocaleString()} encoded
                    </span>
                  </button>
                  {hasErrors ? (
                    <button
                      type="button"
                      onClick={() => toggleEncoderFilter(e.name, "errors")}
                      className={cn(
                        "cursor-pointer rounded-full bg-destructive px-1.5 py-0.5 text-[12px] font-bold tracking-wide text-destructive-foreground transition-opacity",
                        !isErrorsActive && "hover:opacity-90",
                      )}
                      aria-pressed={isErrorsActive}
                      aria-label={`Filter to ${e.errors} error${
                        e.errors === 1 ? "" : "s"
                      } from ${e.name}`}
                    >
                      {e.errors} ERR
                    </button>
                  ) : null}
                </div>
              );
            })}
          </div>
        </Card>
      ) : null}

      {encoderFilter ? (
        <div className="flex items-center gap-3 rounded-lg border bg-secondary px-4 py-3 text-[15px] 2xl:text-[17px]">
          <span
            className={cn(
              "shrink-0 rounded-full px-2 py-0.5 text-[12px] font-bold tracking-wide",
              encoderFilter.mode === "errors"
                ? "bg-destructive text-destructive-foreground"
                : "bg-primary text-primary-foreground",
            )}
          >
            {encoderFilter.mode.toUpperCase()}
          </span>
          <div className="flex-1">
            <div className="font-semibold">
              Showing {encoderFilter.mode} by {encoderFilter.name}
            </div>
            <div className="text-[14px] text-muted-foreground 2xl:text-[16px]">
              {tableData.length.toLocaleString()} record
              {tableData.length === 1 ? "" : "s"} match.
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 gap-1.5"
            onClick={() => setEncoderFilter(null)}
          >
            <X size={13} /> Clear
          </Button>
        </div>
      ) : null}

      {errorsOnly && encoderStats.totalErrors > 0 ? (
        <div className="flex items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-[15px] 2xl:text-[17px]">
          <AlertCircle size={16} className="shrink-0 text-destructive" />
          <div className="flex-1">
            <div className="font-semibold text-destructive">
              {encoderStats.totalErrors.toLocaleString()} encoding error
              {encoderStats.totalErrors === 1 ? "" : "s"} need attention
            </div>
            <div className="text-[14px] text-muted-foreground 2xl:text-[16px]">
              Reconcile by editing each row, or contact the encoder responsible.
            </div>
          </div>
        </div>
      ) : null}

      <AuctionDataTable
        icon={FileText}
        title={
          (errorsOnly ? "Manifest Errors" : "Manifest Records") + titleSuffix
        }
        meta={
          encoderFilter
            ? `${tableData.length.toLocaleString()} of ${manifestRecords.length.toLocaleString()} records`
            : errorsOnly
              ? `${tableData.length.toLocaleString()} of ${manifestRecords.length.toLocaleString()} records`
              : encoderStats.totalErrors > 0
                ? `${encoderStats.totalErrors.toLocaleString()} error${
                    encoderStats.totalErrors === 1 ? "" : "s"
                  }`
                : `${manifestRecords.length.toLocaleString()} records`
        }
        rowLabel="record"
        pageSize={10}
        columns={columns(setOpen, setSelected, groupIndexMap)}
        data={tableData}
        searchFilter={{
          globalFilterFn,
          searchComponentProps: {
            placeholder: "Search barcode, control, bidder…",
          },
        }}
        renderMobileCard={(row: Row<Manifest>) => {
          const it = row.original;
          const hasError = !!it.error_message?.trim();
          const idx = it.is_slash_item
            ? groupIndexMap[it.is_slash_item]
            : undefined;
          const price = it.price ? parseInt(it.price, 10) : 0;
          return (
            <div
              className={cn(
                "flex gap-0",
                hasError && "bg-destructive/5",
              )}
            >
              {hasError ? (
                <div className="w-[3px] shrink-0 bg-destructive" />
              ) : null}
              <div className="flex flex-1 flex-col gap-1 px-4 py-3">
                <div className="flex items-baseline gap-1.5">
                  <span
                    className={cn(
                      "font-mono text-[16px] font-semibold",
                      hasError &&
                        "cursor-pointer underline decoration-dotted underline-offset-2",
                    )}
                    onClick={() => {
                      if (hasError) {
                        setSelected(it);
                        setOpen(true);
                      }
                    }}
                  >
                    {it.barcode}
                  </span>
                  <span className="font-mono text-[12.5px] text-muted-foreground">
                    · {it.control}
                    {idx ? `(A${idx})` : ""}
                  </span>
                  {it.manifest_number ? (
                    <span className="ml-auto rounded bg-secondary px-1.5 py-0.5 font-mono text-[12.5px] font-semibold text-foreground/80">
                      {it.manifest_number}
                    </span>
                  ) : null}
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="truncate text-[15px] font-medium">
                    {it.description}
                  </span>
                  <span className="font-mono text-[15px] text-muted-foreground">
                    #{it.bidder_number}
                  </span>
                  <span className="ml-auto font-mono text-[14.5px] font-semibold">
                    {formatNumberToCurrency(price)}
                  </span>
                </div>
                {hasError ? (
                  <div className="mt-0.5 flex items-center gap-1.5">
                    <AlertCircle size={11} className="text-destructive" />
                    <span className="text-[13px] font-medium text-destructive">
                      {it.error_message}
                    </span>
                    {it.remarks ? (
                      <span className="ml-auto text-[12px] text-muted-foreground">
                        {it.remarks}
                      </span>
                    ) : null}
                  </div>
                ) : (
                  <div className="mt-0.5 flex items-center gap-1.5">
                    <span className="text-[12.5px] font-semibold uppercase tracking-wider text-status-success">
                      Encoded
                    </span>
                    {it.remarks ? (
                      <span className="ml-auto text-[12px] text-muted-foreground">
                        {it.remarks}
                      </span>
                    ) : null}
                  </div>
                )}
              </div>
            </div>
          );
        }}
        actionButtons={
          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className={cn(
                "h-8 gap-1.5",
                errorsOnly &&
                  "border-destructive/30 bg-destructive/10 text-destructive hover:bg-destructive/15 hover:text-destructive",
              )}
              disabled={encoderStats.totalErrors === 0}
              onClick={toggleErrorsOnly}
              aria-pressed={errorsOnly}
            >
              <AlertCircle size={13} />
              Errors only
              {errorsOnly ? (
                <span className="font-mono ml-1 text-[12.5px] font-semibold">
                  · {encoderStats.totalErrors}
                </span>
              ) : null}
            </Button>
            {slashedCount > 0 ? (
              <Button
                type="button"
                variant={slashedOnly ? "default" : "outline"}
                size="sm"
                className="h-8 gap-1.5"
                onClick={toggleSlashedOnly}
                aria-pressed={slashedOnly}
              >
                {slashedOnly ? "Show all" : "Slashed only"}
                <span className="font-mono ml-1 text-[12.5px] font-semibold">
                  · {slashedCount}
                </span>
              </Button>
            ) : null}
            {twoPartCount > 0 ? (
              <Button
                type="button"
                variant={twoPartOnly ? "default" : "outline"}
                size="sm"
                className="h-8 gap-1.5"
                onClick={toggleTwoPartOnly}
                aria-pressed={twoPartOnly}
              >
                {twoPartOnly ? "Show all" : "Two-part only"}
                <span className="font-mono ml-1 text-[12.5px] font-semibold">
                  · {twoPartCount}
                </span>
              </Button>
            ) : null}
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              disabled={isPending}
              onClick={() => startTransition(() => router.refresh())}
              title="Refresh"
            >
              <RefreshCw
                size={14}
                className={isPending ? "animate-spin" : ""}
              />
            </Button>
          </div>
        }
      />
    </>
  );
};
