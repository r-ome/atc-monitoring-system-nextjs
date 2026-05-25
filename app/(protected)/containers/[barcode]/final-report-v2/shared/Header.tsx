"use client";

import { ChevronRight, X } from "lucide-react";
import { Button } from "@/app/components/ui/button";
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
    <header className="flex h-14 items-center justify-between border-b bg-background px-6">
      <nav className="flex items-center gap-1.5 text-[13px] text-muted-foreground">
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
          {container.barcode} · {container.supplier.name}
        </button>
        <ChevronRight size={12} className="opacity-60" />
        <span className="font-semibold text-foreground">
          Generate final report
        </span>
      </nav>

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
    </header>
  );
};
