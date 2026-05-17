"use client";

import { useCallback, useState } from "react";
import type { ComponentType, ReactNode } from "react";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  getSortedRowModel,
  getFilteredRowModel,
  SortingState,
  ColumnFiltersState,
  getPaginationRowModel,
  PaginationState,
  Row,
  RowData,
} from "@tanstack/react-table";
import { ChevronLeft, ChevronRight, InboxIcon } from "lucide-react";
import { Card } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { DataTableProps } from "@/app/components/data-table/columns";
import { SearchComponent } from "@/app/components/data-table/SearchComponent";
import { FilterColumnComponent } from "@/app/components/data-table/FilterColumnComponent";
import {
  Empty,
  EmptyMedia,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
} from "@/app/components/ui/empty";
import { cn } from "@/app/lib/utils";

export interface AuctionDataTableProps<TData, TValue>
  extends DataTableProps<TData, TValue> {
  icon?: ComponentType<{ size?: number; className?: string }>;
  meta?: ReactNode;
  rowLabel?: string;
}

export const AuctionDataTable = <TData, TValue>({
  columns,
  data,
  actionButtons,
  searchFilter,
  rowSelection,
  getRowId,
  columnFilter,
  onRowClick,
  title,
  footer,
  pageSize = 10,
  initialSorting = [],
  icon: Icon,
  meta,
  rowLabel = "row",
}: AuctionDataTableProps<TData, TValue>) => {
  const [globalFilter, setGlobalFilter] = useState<string>("");
  const [sorting, setSorting] = useState<SortingState>(initialSorting);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize,
  });

  const table = useReactTable({
    data,
    columns,
    getRowId,
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onGlobalFilterChange: setGlobalFilter,
    onRowSelectionChange: rowSelection?.onRowSelectionChange,
    enableRowSelection: !!rowSelection,
    globalFilterFn: searchFilter?.globalFilterFn,
    filterFns: {
      includesIn: (
        row: Row<RowData>,
        columnId: string,
        filterValue: unknown,
      ): boolean => {
        if (
          !filterValue ||
          (Array.isArray(filterValue) && filterValue.length === 0)
        )
          return true;
        if (Array.isArray(filterValue)) {
          return filterValue.includes(row.getValue(columnId));
        }
        return true;
      },
    },
    state: {
      rowSelection: rowSelection?.selectedRows ?? {},
      globalFilter,
      pagination,
      sorting,
      columnFilters,
    },
  });

  const onChangeFilter = useCallback(
    (value: string[]) =>
      columnFilter?.column &&
      table.getColumn(columnFilter.column)?.setFilterValue(value),
    [table, columnFilter?.column],
  );

  const totalFiltered = table.getFilteredRowModel().rows.length;
  const pageIndex = table.getState().pagination.pageIndex;
  const pageCount = Math.max(table.getPageCount(), 1);
  const visibleRows = table.getRowModel().rows;
  const start = totalFiltered === 0 ? 0 : pageIndex * pageSize + 1;
  const end = Math.min((pageIndex + 1) * pageSize, totalFiltered);

  const hasHeader = !!title || !!Icon || !!meta;
  const hasToolbar =
    !!searchFilter?.globalFilterFn || !!columnFilter?.options || !!actionButtons;

  return (
    <Card className="flex flex-col gap-0 overflow-hidden p-0 2xl:text-[15px]">
      {hasHeader ? (
        <div className="flex items-center gap-2 border-b px-[18px] py-3.5 2xl:px-5">
          {Icon ? (
            <Icon size={14} className="text-muted-foreground" />
          ) : null}
          {title ? (
            <span className="text-[14px] font-semibold 2xl:text-[17.5px]">
              {title}
            </span>
          ) : null}
          {meta ? (
            <span className="ml-auto text-[11px] text-muted-foreground 2xl:text-[14px]">
              {meta}
            </span>
          ) : null}
        </div>
      ) : null}

      {hasToolbar ? (
        <div className="flex flex-col gap-2 border-b px-[18px] py-3 md:flex-row md:items-center 2xl:px-5">
          {searchFilter?.globalFilterFn ? (
            <div className="w-full max-w-[420px]">
              <SearchComponent
                value={globalFilter}
                onChangeEvent={(value) => setGlobalFilter?.(value)}
                {...searchFilter.searchComponentProps}
              />
            </div>
          ) : null}
          {columnFilter?.options ? (
            <div className="w-full md:w-[240px]">
              <FilterColumnComponent
                options={columnFilter.options}
                onChangeEvent={onChangeFilter}
                {...columnFilter.filterComponentProps}
              />
            </div>
          ) : null}
          {actionButtons ? (
            <div className="md:ml-auto md:flex md:items-center md:gap-2">
              {actionButtons}
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="overflow-auto">
        <table className="w-full border-collapse text-[13px] 2xl:text-[15px]">
          <thead className="sticky top-0 z-10 bg-card">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr
                key={headerGroup.id}
                className="caps-label text-[10.5px] 2xl:text-[13px]"
              >
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="border-b px-3 py-2.5 text-center align-middle font-semibold first:pl-[18px] last:pr-[18px] 2xl:first:pl-5 2xl:last:pr-5"
                    style={{
                      minWidth:
                        header.column.columnDef.minSize ??
                        header.column.columnDef.size,
                      maxWidth: header.column.columnDef.size,
                    }}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {visibleRows.length ? (
              visibleRows.map((row, i) => (
                <tr
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  onClick={() => onRowClick?.(row.original)}
                  className={cn(
                    "transition-colors hover:bg-secondary/50",
                    i !== visibleRows.length - 1 && "border-b",
                    onRowClick && "cursor-pointer",
                  )}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      className="px-3 py-2.5 text-center align-middle first:pl-[18px] last:pr-[18px] 2xl:first:pl-5 2xl:last:pr-5"
                      style={{
                        minWidth:
                          cell.column.columnDef.minSize ??
                          cell.column.columnDef.size,
                        maxWidth: cell.column.columnDef.size,
                      }}
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length}>
                  <Empty className="py-10">
                    <EmptyMedia variant="icon">
                      <InboxIcon />
                    </EmptyMedia>
                    <EmptyHeader>
                      <EmptyTitle>No results</EmptyTitle>
                      <EmptyDescription>No data to display.</EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {footer ? (
        <div className="border-t px-[18px] py-3 text-[12px] 2xl:px-5 2xl:text-[14px]">
          {footer}
        </div>
      ) : null}

      <div className="flex flex-col items-center justify-between gap-2 border-t px-[18px] py-2.5 text-[12px] text-muted-foreground sm:flex-row 2xl:px-5 2xl:text-[14px]">
        <span>
          Showing {start.toLocaleString()}
          {totalFiltered > 0 ? `–${end.toLocaleString()}` : ""} of{" "}
          {totalFiltered.toLocaleString()} {rowLabel}
          {totalFiltered === 1 ? "" : "s"}
        </span>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">
            Page {pageIndex + 1} of {pageCount}
          </span>
          <Button
            variant="outline"
            size="sm"
            className="h-7 px-2"
            disabled={!table.getCanPreviousPage()}
            onClick={() => table.previousPage()}
            aria-label="Previous page"
          >
            <ChevronLeft size={14} />
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-7 px-2"
            disabled={!table.getCanNextPage()}
            onClick={() => table.nextPage()}
            aria-label="Next page"
          >
            <ChevronRight size={14} />
          </Button>
        </div>
      </div>
    </Card>
  );
};
