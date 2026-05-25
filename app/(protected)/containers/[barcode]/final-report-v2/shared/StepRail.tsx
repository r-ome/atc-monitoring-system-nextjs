"use client";

import { Check } from "lucide-react";
import { cn } from "@/app/lib/utils";
import { V2_STEP_META, V2_STEP_ORDER, type V2StepKey } from "./types";

type StepRailProps = {
  current: V2StepKey;
  onJump?: (step: V2StepKey) => void;
  isStepEnabled?: (step: V2StepKey) => boolean;
};

export const StepRail = ({
  current,
  onJump,
  isStepEnabled,
}: StepRailProps) => {
  const currentIdx = V2_STEP_ORDER.indexOf(current);

  return (
    <div className="flex items-center gap-0 border-b bg-background px-6 py-3.5">
      {V2_STEP_ORDER.map((key, idx) => {
        const meta = V2_STEP_META[key];
        const done = idx < currentIdx;
        const active = idx === currentIdx;
        const upcoming = idx > currentIdx;
        const enabled = isStepEnabled?.(key) ?? true;
        const clickable = Boolean(onJump) && enabled && !active;

        return (
          <div key={key} className="flex flex-1 items-center">
            <button
              type="button"
              onClick={() => clickable && onJump?.(key)}
              disabled={!clickable}
              className={cn(
                "group flex items-center gap-2.5 text-left",
                upcoming && "opacity-55",
                clickable && "cursor-pointer",
                !clickable && "cursor-default",
              )}
            >
              <span
                className={cn(
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-[12px] font-semibold leading-none",
                  done && "border-primary bg-primary text-primary-foreground",
                  active &&
                    "border-primary bg-background text-primary border-[1.5px]",
                  !done && !active && "border-border bg-muted text-muted-foreground",
                )}
              >
                {done ? <Check size={14} /> : meta.n}
              </span>
              <span className="hidden flex-col leading-tight lg:flex">
                <span
                  className={cn(
                    "text-[13px] font-semibold",
                    active ? "text-foreground" : "text-foreground/80",
                  )}
                >
                  {meta.title}
                </span>
                <span className="text-[11.5px] text-muted-foreground">
                  {meta.sub}
                </span>
              </span>
            </button>
            {idx < V2_STEP_ORDER.length - 1 ? (
              <div
                className={cn(
                  "mx-4 h-px flex-1",
                  idx < currentIdx ? "bg-primary" : "bg-border",
                )}
              />
            ) : null}
          </div>
        );
      })}
    </div>
  );
};
