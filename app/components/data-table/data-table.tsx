"use client";

import { useCallback, useState } from "react";
import { Button } from "@/app/components/ui/button";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/app/components/ui/table";
import { DataTableProps } from "./columns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from "@/app/components/ui/dropdown-menu";
import { SearchComponent } from "@/app/components/data-table/SearchComponent";
import { FilterColumnComponent } from "@/app/components/data-table/FilterColumnComponent";
import { ChevronDown } from "lucide-react";
import { cn } from "@/app/lib/utils";

export const DataTable = <TData, TValue>({
  columns,
  data,
  actionButtons,
  searchFilter,
  rowSelection,
  getRowId,
  columnFilter,
  onRowClick,
  filterColumns = false,
  title,
}: DataTableProps<TData, TValue>) => {
  const [globalFilter, setGlobalFilter] = useState<string>("");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
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
        filterValue: unknown
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
    [table, columnFilter?.column]
  );

  return (
    <div className="rounded-md border p-4 overflow-auto">
      {title ? <div>{title}</div> : null}
      <div className="flex items-center justify-between gap-4 py-4">
        {searchFilter?.globalFilterFn && (
          <SearchComponent
            value={globalFilter}
            onChangeEvent={(value) => setGlobalFilter?.(value)}
            {...searchFilter.searchComponentProps}
          />
        )}

        {columnFilter?.options && (
          <FilterColumnComponent
            options={columnFilter?.options}
            onChangeEvent={onChangeFilter}
            {...columnFilter.filterComponentProps}
          />
        )}

        <div className="flex gap-4">
          {actionButtons && <div>{actionButtons}</div>}

          {filterColumns && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="ml-auto">
                  Filter Column <ChevronDown />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {table
                  .getAllColumns()
                  .filter((column) => column.getCanHide())
                  .map((item) => (
                    <DropdownMenuCheckboxItem
                      key={item.id}
                      className="capitalize"
                      checked={item.getIsVisible()}
                      onCheckedChange={(value) =>
                        item.toggleVisibility(!!value)
                      }
                    >
                      {item.id.replace(/_/gi, " ")}
                    </DropdownMenuCheckboxItem>
                  ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                return (
                  <TableHead
                    key={header.id}
                    style={{
                      minWidth: header.column.columnDef.size,
                      maxWidth: header.column.columnDef.size,
                    }}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                );
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                data-state={row.getIsSelected() && "selected"}
                onClick={() => onRowClick?.(row.original)}
                className={cn(onRowClick ? "hover:cursor-pointer" : "")}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell
                    key={cell.id}
                    style={{
                      minWidth: cell.column.columnDef.size,
                      maxWidth: cell.column.columnDef.size,
                    }}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                No results.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <div className="flex justify-between my-2">
        <div>Total of {table.getFilteredRowModel().rows.length} rows</div>
        <div className="flex items-center space-x-2">
          <div>
            Page {table.getState().pagination.pageIndex + 1} of{" "}
            {table.getPageCount()}
          </div>

          <Button
            variant="outline"
            size="sm"
            disabled={!table.getCanPreviousPage()}
            onClick={() => {
              table.previousPage();
            }}
            className="cursor-pointer"
          >
            Prev
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="cursor-pointer"
            disabled={!table.getCanNextPage()}
            onClick={() => {
              table.nextPage();
            }}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
};
