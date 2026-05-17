import type { ReactNode } from "react";
import { cn } from "@/app/lib/utils";

type PageContainerProps = {
  children: ReactNode;
  className?: string;
};

export function PageContainer({ children, className }: PageContainerProps) {
  return (
    <div
      className={cn(
        "mx-auto flex max-w-[1400px] flex-col gap-3 sm:gap-[18px] 2xl:max-w-[1700px] 2xl:gap-6",
        className,
      )}
    >
      {children}
    </div>
  );
}
