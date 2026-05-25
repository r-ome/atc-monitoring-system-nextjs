"use client";

import { AlertCircle, ArrowRight, ChevronLeft, Loader2 } from "lucide-react";
import { Button } from "@/app/components/ui/button";

type FooterProps = {
  leftLabel?: string;
  leftDisabled?: boolean;
  onBack?: () => void;
  rightLabel?: string;
  rightDisabled?: boolean;
  rightVariant?: "default" | "destructive";
  onPrimary?: () => void;
  onSaveExit?: () => void;
  saveExitDisabled?: boolean;
  warn?: string | null;
  loading?: string | null;
};

export const Footer = ({
  leftLabel = "Back",
  leftDisabled,
  onBack,
  rightLabel = "Continue",
  rightDisabled,
  rightVariant = "default",
  onPrimary,
  onSaveExit,
  saveExitDisabled,
  warn,
  loading,
}: FooterProps) => {
  return (
    <footer className="flex h-16 items-center justify-between border-t bg-white px-6">
      <Button
        type="button"
        variant="outline"
        onClick={onBack}
        disabled={leftDisabled || !onBack}
      >
        <ChevronLeft size={14} /> {leftLabel}
      </Button>

      <div className="flex items-center gap-3.5">
        {loading ? (
          <span className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
            <Loader2 size={12} className="animate-spin" />
            {loading}
          </span>
        ) : null}
        {warn ? (
          <span className="flex items-center gap-1.5 text-[12.5px] font-medium text-destructive">
            <AlertCircle size={14} /> {warn}
          </span>
        ) : null}
        {onSaveExit ? (
          <Button
            type="button"
            variant="ghost"
            onClick={onSaveExit}
            disabled={saveExitDisabled}
          >
            Save &amp; exit
          </Button>
        ) : null}
        {onPrimary ? (
          <Button
            type="button"
            variant={rightVariant === "destructive" ? "destructive" : "default"}
            onClick={onPrimary}
            disabled={rightDisabled}
            className="h-9 px-4 font-semibold"
          >
            {rightLabel} <ArrowRight size={14} />
          </Button>
        ) : null}
      </div>
    </footer>
  );
};
