"use client";

import { ReactNode } from "react";
import { Button } from "@/app/components/ui/button";
import { Loader2Icon } from "lucide-react";
import { STEP_LABEL, STEP_ORDER, type StepKey } from "./types";
import { cn } from "@/app/lib/utils";

interface StepShellProps {
  step: StepKey;
  visibleSteps: StepKey[];
  onBack?: () => void;
  onNext?: () => void;
  onJumpTo?: (step: StepKey) => void;
  jumpDisabled?: (step: StepKey) => boolean;
  nextLabel?: string;
  nextDisabled?: boolean;
  backDisabled?: boolean;
  loading?: string | null;
  children: ReactNode;
  description?: ReactNode;
  rightSlot?: ReactNode;
}

export const StepShell = ({
  step,
  visibleSteps,
  onBack,
  onNext,
  onJumpTo,
  jumpDisabled,
  nextLabel = "Next",
  nextDisabled,
  backDisabled,
  loading,
  children,
  description,
  rightSlot,
}: StepShellProps) => {
  const currentIndex = visibleSteps.indexOf(step);

  return (
    <div className="flex flex-col gap-3">
      <ol className="flex flex-wrap gap-2 text-xs">
        {visibleSteps.map((key, index) => {
          const isCurrent = key === step;
          const isCompleted = index < currentIndex;
          const disabled =
            isCurrent || !onJumpTo || (jumpDisabled?.(key) ?? false);
          return (
            <li key={key}>
              <button
                type="button"
                onClick={() => {
                  if (disabled) return;
                  onJumpTo?.(key);
                }}
                disabled={disabled}
                className={cn(
                  "border px-2 py-1 rounded transition-colors",
                  isCurrent && "bg-foreground text-background border-foreground",
                  isCompleted && !isCurrent && "bg-muted",
                  !disabled && "hover:bg-accent cursor-pointer",
                  disabled && !isCurrent && "cursor-not-allowed opacity-60",
                )}
              >
                {index + 1}. {STEP_LABEL[key]}
              </button>
            </li>
          );
        })}
      </ol>

      {description ? (
        <p className="text-sm text-muted-foreground">{description}</p>
      ) : null}

      <div className="min-h-[200px]">{children}</div>

      <div className="flex items-center justify-between gap-2 border-t pt-3">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          disabled={backDisabled || !onBack}
        >
          Back
        </Button>
        <div className="flex items-center gap-2">
          {loading ? (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Loader2Icon className="h-3 w-3 animate-spin" />
              {loading}
            </span>
          ) : null}
          {rightSlot}
          {onNext ? (
            <Button
              type="button"
              onClick={onNext}
              disabled={nextDisabled || Boolean(loading)}
            >
              {nextLabel}
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export const stepProgress = (
  step: StepKey,
  visibleSteps: StepKey[],
): { index: number; total: number } => {
  return {
    index: visibleSteps.indexOf(step) + 1,
    total: visibleSteps.length,
  };
};

export const _STEP_ORDER = STEP_ORDER;
