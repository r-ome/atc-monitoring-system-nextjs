"use client";

import { ColumnDef, TableState, Updater } from "@tanstack/react-table";
import type { SearchComponentProps } from "@/app/components/data-table/SearchComponent";

import { FilterFnOption } from "@tanstack/react-table";

export interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  getRowId?: (row: TData) => string;
  rowSelection?: {
    selectedRows: TableState["rowSelection"];
    onRowSelectionChange: (
      updater: Updater<TableState["rowSelection"]>
    ) => void;
  };
  actionButtons?: React.ReactNode;
  searchFilter?: {
    globalFilterFn?: FilterFnOption<TData>;
    searchComponentProps?: Partial<SearchComponentProps>;
  };
}
