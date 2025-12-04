"use client";

import { ColumnDef } from "@tanstack/react-table";
import { ContainerDueDate } from "src/entities/models/Container";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/app/components/ui/tooltip";

export const columns: ColumnDef<ContainerDueDate>[] = [
  {
    accessorKey: "barcode",
    size: 80,
    header: () => {
      return <div className="flex justify-center">BARCODE</div>;
    },
    cell: ({ row }) => {
      const container = row.original;
      return (
        <div className="flex justify-center">
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="inline-block">
                <div className="">{container.barcode}</div>
              </span>
            </TooltipTrigger>
            <TooltipContent side="left">
              <div className="flex-col">
                <p>BL Number: {container.bill_of_lading_number}</p>
                <p>Container Number: {container.container_number}</p>
                <p>Arrival: {container.arrival_date}</p>
              </div>
            </TooltipContent>
          </Tooltip>
        </div>
      );
    },
  },
  {
    accessorKey: "arrival_date",
    size: 80,
    header: () => {
      return <div className="flex justify-center">ARRIVAL</div>;
    },
    cell: ({ row }) => {
      const container = row.original;

      return (
        <div className="flex justify-center">{container.arrival_date}</div>
      );
    },
  },
  {
    accessorKey: "due_date",
    size: 80,
    header: () => {
      return <div className="flex justify-center">DUE DATE</div>;
    },
    cell: ({ row }) => {
      const container = row.original;

      return <div className="flex justify-center">{container.due_date}</div>;
    },
  },
];
