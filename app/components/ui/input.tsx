import * as React from "react";

import { cn } from "@/app/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

function Input({
  className,
  error,
  name,
  type,
  onChange,
  ...props
}: React.ComponentProps<"input"> & {
  error?: Record<string, string[] | null>;
}) {
  const errorMessage = error?.[name as string]?.[0];

  return (
    <div className="flex flex-col space-y-2 w-full">
      <input
        type={type}
        name={name}
        data-slot="input"
        className={cn(
          "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input flex h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
          "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
          { "border-red-500": !!errorMessage },
          className
        )}
        onChange={(e) => {
          if (typeof e.target.value === "string" && type !== "file") {
            e.target.value = e.target.value.toUpperCase();
          }
          onChange?.(e);
        }}
        {...props}
      />
      {errorMessage ? (
        <span className="text-red-500 -mt-2 text-xs">{errorMessage}</span>
      ) : null}
    </div>
  );
}

export { Input };
