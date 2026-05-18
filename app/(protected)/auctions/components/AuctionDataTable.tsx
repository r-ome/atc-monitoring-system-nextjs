import { DataTable } from "@/app/components/data-table/data-table";
import type { DataTableProps } from "@/app/components/data-table/columns";

export type AuctionDataTableProps<TData, TValue> = DataTableProps<
  TData,
  TValue
>;

/**
 * Auction-style data table: same shared `DataTable`, but wrapped in the
 * card chrome (icon + title + meta header, sticky table, footer pagination).
 * Pass `embedded` explicitly to override.
 */
export const AuctionDataTable = <TData, TValue>({
  embedded = false,
  ...props
}: AuctionDataTableProps<TData, TValue>) => {
  return <DataTable {...props} embedded={embedded} />;
};
