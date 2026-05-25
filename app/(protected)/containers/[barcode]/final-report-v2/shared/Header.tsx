"use client";

import { ChevronRight, X } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Card } from "@/app/components/ui/card";
import { BranchBadge } from "@/app/components/admin";
import { cn } from "@/app/lib/utils";
import type { V2ContainerContext } from "./types";

type HeaderProps = {
  container: V2ContainerContext;
  savedAgo: string | null;
  savedError: boolean;
  onClose: () => void;
  // Breadcrumb clicks must go through the same flush guard as Close so
  // pending Tax-step edits aren't dropped. V2Wizard wires this to a handler
  // that awaits flushBeforeLeave before router.push(href).
  onNavigate: (href: string) => void;
};

export const Header = ({
  container,
  savedAgo,
  savedError,
  onClose,
  onNavigate,
}: HeaderProps) => {
  return (
    <>
      <nav className="flex items-center gap-1.5 text-[12px] text-muted-foreground 2xl:text-[14px]">
        <button
          type="button"
          onClick={() => onNavigate("/containers")}
          className="cursor-pointer hover:text-foreground"
        >
          Containers
        </button>
        <ChevronRight size={12} className="opacity-60" />
        <button
          type="button"
          onClick={() => onNavigate(`/containers/${container.barcode}`)}
          className="cursor-pointer hover:text-foreground"
        >
          {container.barcode}
        </button>
        <ChevronRight size={12} className="opacity-60" />
        <span className="font-medium text-foreground">
          Generate final report
        </span>
      </nav>

      <Card className="flex flex-row flex-wrap items-center justify-between gap-4 p-4 sm:gap-6 sm:p-5 2xl:p-6">
        <div className="flex min-w-0 flex-col gap-1.5">
          <div className="flex flex-wrap items-center gap-2.5">
            {container.branch_name ? (
              <BranchBadge branch={container.branch_name} />
            ) : null}
            <span className="text-[11.5px] font-medium uppercase tracking-wider text-muted-foreground">
              {container.barcode} · {container.supplier.name}
            </span>
          </div>
          <h1 className="truncate text-[18px] font-semibold tracking-tight sm:text-[22px] 2xl:text-[28px]">
            Generate final report
          </h1>
        </div>
        <div className="flex items-center gap-3">
          {savedAgo ? (
            <div className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
              <span
                className={cn(
                  "h-1.5 w-1.5 rounded-full",
                  savedError ? "bg-destructive" : "bg-emerald-500",
                )}
              />
              {savedError ? "Couldn't save" : `Draft saved · ${savedAgo} ago`}
            </div>
          ) : null}
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X size={14} /> Close
          </Button>
        </div>
      </Card>
    </>
  );
};
