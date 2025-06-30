"use client";

import { use, useEffect, useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/app/components/ui/popover";
import { Button } from "@/app/components/ui/button";
import {
  Command,
  CommandInput,
  CommandList,
  CommandItem,
  CommandEmpty,
} from "@/app/components/ui/command";
import { cn } from "@/app/lib/utils";
import { Check, ChevronsUpDown } from "lucide-react";

interface SelectWithSearch {
  placeholder: string;
  options: { label: string; value: string; [key: string]: any }[];
  setSelected: (option: Record<string, string | number | boolean>) => void;
  modal?: boolean;
  side?: "bottom" | "top" | "right" | "left";
  defaultValue?: { label: string; value: string };
}

export const SelectWithSearch: React.FC<SelectWithSearch> = ({
  placeholder,
  options,
  setSelected,
  defaultValue = null,
  modal = false,
  side = "bottom",
}) => {
  const [open, setOpen] = useState<boolean>(false);
  const [search, setSearch] = useState<string>("");

  useEffect(() => {
    if (defaultValue) {
      const value = options.find((item) => item.value === defaultValue.value);
      if (value) setSearch(value.label);
    }
  }, [defaultValue, options]);

  return (
    <Popover modal={modal} open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild className="w-full">
        <Button
          variant="outline"
          className={cn("justify-between", !search && "text-muted-foreground")}
        >
          {search
            ? options.find((option) =>
                option.label.toLowerCase().includes(search.toLowerCase())
              )?.label
            : `${placeholder}`}
          <ChevronsUpDown className="opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[var(--radix-popover-trigger-width)] h-fit"
        side={side}
      >
        <Command className="w-full">
          <CommandInput placeholder={placeholder} className="h-9 uppercase" />
          <CommandList>
            <CommandEmpty>Nothing found</CommandEmpty>
            {options.map((option, i) => (
              <CommandItem
                className={cn(
                  "cursor-pointer w-full",
                  option.disabled && "text-red-500 cursor-not-allowed"
                )}
                disabled={option.disabled}
                value={option.label}
                key={i}
                onSelect={() => {
                  setSearch(option.label);
                  setSelected(option);
                  setOpen(false);
                }}
              >
                {option.label}
                <Check
                  className={cn(
                    "ml-auto",
                    search &&
                      option.label.toLowerCase().includes(search.toLowerCase())
                      ? "opacity-100"
                      : "opacity-0"
                  )}
                />
              </CommandItem>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};
