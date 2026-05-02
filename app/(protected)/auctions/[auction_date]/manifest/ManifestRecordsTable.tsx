"use client";

import { useState, useMemo } from "react";
import { DataTable } from "@/app/components/data-table/data-table";
import { CoreRow } from "@tanstack/react-table";
import { columns } from "./manifest-columns";
import { Manifest } from "src/entities/models/Manifest";
import { UpdateManifestModal } from "./UpdateManifestModal";
import { buildGroupIndexMap } from "@/app/lib/utils";

interface ManifestRecordsTableProps {
  manifestRecords: Manifest[];
  canDeleteFailedRecords: boolean;
}

export const ManifestRecordsTable = ({
  manifestRecords,
  canDeleteFailedRecords,
}: ManifestRecordsTableProps) => {
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
    } = row.original;

    return [
      bidder_number,
      barcode,
      control,
      description,
      manifest_number,
      price,
    ]
      .filter(Boolean)
      .some((field) => field!.toLowerCase().includes(search));
  };

  const groupIndexMap = useMemo(
    () => buildGroupIndexMap(manifestRecords, (r) => r.is_slash_item),
    [manifestRecords]
  );

  const errorStats = useMemo(() => {
    const rowsWithErrors = manifestRecords.filter(
      (record) => record.error_message?.trim(),
    );
    const errorsByUploader = Array.from(
      rowsWithErrors
        .reduce((map, record) => {
          const uploadedBy = record.remarks?.trim() || "Unknown";
          map.set(uploadedBy, (map.get(uploadedBy) ?? 0) + 1);
          return map;
        }, new Map<string, number>())
        .entries(),
    ).sort(([a], [b]) => a.localeCompare(b));

    return {
      totalErrors: rowsWithErrors.length,
      errorsByUploader,
    };
  }, [manifestRecords]);

  return (
    <>
      <UpdateManifestModal
        open={open}
        setOpen={setOpen}
        selected={selected}
        canDeleteFailedRecord={canDeleteFailedRecords}
      />
      <DataTable
        pageSize={15}
        columns={columns(setOpen, setSelected, groupIndexMap)}
        data={manifestRecords.filter(
          (item) => item.barcode && !item.barcode?.match(/barcode/gi)
        )}
        searchFilter={{
          globalFilterFn,
          searchComponentProps: {
            placeholder: "Search item here",
          },
        }}
        actionButtons={
          <div className="flex flex-wrap items-center gap-6 text-sm">
            <span>
              Errors:{" "}
              <span className="font-semibold text-red-500">
                {errorStats.totalErrors}
              </span>
            </span>
            {errorStats.errorsByUploader.map(([uploadedBy, count]) => (
              <span key={uploadedBy}>
                {uploadedBy}:{" "}
                <span className="font-semibold text-red-500">{count}</span>
              </span>
            ))}
          </div>
        }
      />
    </>
  );
};
