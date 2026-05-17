import type { ReactNode } from "react";

type PageHeaderProps = {
  title: string;
  subtitle?: ReactNode;
  actions?: ReactNode;
};

export function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-[18px] font-semibold tracking-tight sm:text-[22px] 2xl:text-[28px]">
          {title}
        </h1>
        {subtitle ? (
          <p className="mt-0.5 text-[12.5px] text-muted-foreground sm:text-[13.5px] 2xl:text-[15px]">
            {subtitle}
          </p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex flex-wrap items-center gap-2 [&>*]:flex-1 sm:[&>*]:flex-initial">
          {actions}
        </div>
      ) : null}
    </div>
  );
}
