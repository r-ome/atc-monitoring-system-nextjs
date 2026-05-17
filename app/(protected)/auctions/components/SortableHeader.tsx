"use client";

import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import type { Column } from "@tanstack/react-table";
import { cn } from "@/app/lib/utils";

interface SortableHeaderProps<T> {
  column: Column<T, unknown>;
  label: string;
  align?: "left" | "right" | "center";
}

export function SortableHeader<T>({
  column,
  label,
  align = "center",
}: SortableHeaderProps<T>) {
  const sort = column.getIsSorted();
  const Icon = sort === "asc" ? ArrowUp : sort === "desc" ? ArrowDown : ArrowUpDown;

  return (
    <div
      className={cn(
        "flex w-full items-center",
        align === "right" && "justify-end",
        align === "center" && "justify-center",
        align === "left" && "justify-start",
      )}
    >
      <button
        type="button"
        onClick={() => column.toggleSorting(sort === "asc")}
        className="inline-flex items-center gap-1 cursor-pointer text-inherit hover:text-foreground transition-colors"
      >
        {label}
        <Icon size={11} className="opacity-60" />
      </button>
    </div>
  );
}
