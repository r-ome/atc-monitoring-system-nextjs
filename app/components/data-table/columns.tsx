"use client";

import type { ComponentType, ReactNode } from "react";
import {
  ColumnDef,
  FilterFnOption,
  Row,
  SortingState,
  TableState,
  Updater,
} from "@tanstack/react-table";
import type { SearchComponentProps } from "@/app/components/data-table/SearchComponent";
import type { FilterColumnComponentProps } from "./FilterColumnComponent";

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
  actionButtons?: ReactNode;
  searchFilter?: {
    globalFilterFn?: FilterFnOption<TData>;
    searchComponentProps?: Partial<SearchComponentProps>;
  };
  columnFilter?: {
    column: string;
    options: Record<string, string>[];
    globalFilterFn?: FilterFnOption<TData>;
    filterComponentProps?: Partial<FilterColumnComponentProps>;
  };
  onRowClick?: (row: TData) => void;
  title?: ReactNode;
  footer?: ReactNode;
  pageSize?: number;
  initialSorting?: SortingState;
  icon?: ComponentType<{ size?: number; className?: string }>;
  meta?: ReactNode;
  rowLabel?: string;
  renderMobileCard?: (row: Row<TData>) => ReactNode;
  /**
   * When true, render the table without the outer Card wrapper so it can be
   * embedded inside a parent Card. Toolbar, table, and pagination still render.
   */
  embedded?: boolean;
}
