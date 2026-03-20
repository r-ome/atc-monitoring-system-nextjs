"use client";

import { useState, useMemo } from "react";
import { CheckIcon, SearchIcon, Trash2Icon, XIcon } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/app/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/app/components/ui/tooltip";
import { cn } from "@/app/lib/utils";
import {
  type ManifestSheetRecord,
  type UploadManifestInput,
} from "src/entities/models/Manifest";

const EDITABLE_KEYS: (keyof ManifestSheetRecord)[] = [
  "BARCODE",
  "CONTROL",
  "DESCRIPTION",
  "BIDDER",
  "PRICE",
  "QTY",
  "MANIFEST",
];

interface ManifestPreviewTableProps {
  data: UploadManifestInput[];
  editingIndex: number | null;
  editingValues: ManifestSheetRecord | null;
  onStartEdit: (index: number) => void;
  onEditChange: (key: keyof ManifestSheetRecord, value: string) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onRemoveRow: (index: number) => void;
}

export const ManifestPreviewTable: React.FC<ManifestPreviewTableProps> = ({
  data,
  editingIndex,
  editingValues,
  onStartEdit,
  onEditChange,
  onSaveEdit,
  onCancelEdit,
  onRemoveRow,
}) => {
  const [search, setSearch] = useState("");

  const filteredData = useMemo(() => {
    if (!search.trim()) return data;
    const term = search.toLowerCase();
    return data.filter((row) =>
      EDITABLE_KEYS.some((key) =>
        (row[key] ?? "").toLowerCase().includes(term),
      ) || row.error?.toLowerCase().includes(term),
    );
  }, [data, search]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") onSaveEdit();
    if (e.key === "Escape") onCancelEdit();
  };

  const renderCell = (
    row: UploadManifestInput,
    index: number,
    key: keyof ManifestSheetRecord,
  ) => {
    if (editingIndex === index && editingValues) {
      return (
        <input
          className="w-full rounded border bg-background px-1.5 py-0.5 text-sm outline-none focus:ring-1 focus:ring-ring"
          value={editingValues[key] ?? ""}
          onChange={(e) => onEditChange(key, e.target.value)}
          onKeyDown={handleKeyDown}
        />
      );
    }

    const value = row[key] ?? "";
    if (key === "DESCRIPTION") {
      return (
        <span className="truncate block" title={value}>
          {value}
        </span>
      );
    }
    return value;
  };

  const indexedData = useMemo(
    () => filteredData.map((row) => ({ row, originalIndex: data.indexOf(row) })),
    [filteredData, data],
  );

  return (
    <div className="flex flex-col gap-2 overflow-hidden min-h-0">
      <div className="relative shrink-0">
        <SearchIcon className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
        <input
          placeholder="Search records..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="placeholder:text-muted-foreground flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 pl-9 text-sm outline-hidden focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
        />
      </div>
      <div className="overflow-y-auto border rounded-md">
      <Table className="table-fixed w-full text-sm">
        <TableHeader className="sticky top-0 z-10 bg-background">
          <TableRow>
            <TableHead className="w-30">Barcode</TableHead>
            <TableHead className="w-20">Control #</TableHead>
            <TableHead className="w-30">Description</TableHead>
            <TableHead className="w-20">Bidder #</TableHead>
            <TableHead className="w-16">Price</TableHead>
            <TableHead className="w-14">Qty</TableHead>
            <TableHead className="w-14">Manifest</TableHead>
            <TableHead className="w-20">Status</TableHead>
            <TableHead className="w-16 text-center">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {indexedData.map(({ row, originalIndex }) => (
            <TableRow
              key={originalIndex}
              className={cn(
                !row.isValid && "bg-destructive/10",
                editingIndex !== originalIndex &&
                  "cursor-pointer hover:bg-muted/50",
              )}
              onClick={() => {
                if (editingIndex === null) onStartEdit(originalIndex);
              }}
            >
              {EDITABLE_KEYS.map((key) => (
                <TableCell key={key} className="truncate">
                  {renderCell(row, originalIndex, key)}
                </TableCell>
              ))}
              <TableCell className="truncate text-xs">
                {row.isValid ? (
                  <span className="text-green-600">Valid</span>
                ) : (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="text-destructive cursor-help truncate block">
                        {row.error}
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>{row.error}</TooltipContent>
                  </Tooltip>
                )}
              </TableCell>
              <TableCell onClick={(e) => e.stopPropagation()}>
                {editingIndex === originalIndex ? (
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={onSaveEdit}
                      className="rounded p-0.5 hover:bg-accent text-green-600"
                    >
                      <CheckIcon className="size-4 cursor-pointer" />
                    </button>
                    <button
                      type="button"
                      onClick={onCancelEdit}
                      className="rounded p-0.5 hover:bg-accent text-muted-foreground"
                    >
                      <XIcon className="size-4 cursor-pointer" />
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-1 justify-center">
                    <button
                      type="button"
                      onClick={() => onRemoveRow(originalIndex)}
                      className="rounded p-0.5 hover:bg-accent text-destructive"
                    >
                      <Trash2Icon className="size-3.5 cursor-pointer" />
                    </button>
                  </div>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
    </div>
  );
};
