"use client";

import { useEffect, useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/app/components/ui/popover";
import { Button } from "@/app/components/ui/button";
import {
  Command,
  CommandGroup,
  CommandItem,
} from "@/app/components/ui/command";
import { Checkbox } from "@/app/components/ui/checkbox";

export interface FilterColumnComponentProps {
  options: Record<string, string>[];
  onChangeEvent: (value: string[]) => void;
  placeholder?: string;
}

export const FilterColumnComponent: React.FC<FilterColumnComponentProps> = ({
  options = [],
  onChangeEvent,
  placeholder,
}) => {
  const [selected, setSelected] = useState<string[]>([]);

  const toggleItem = (value: string) => {
    setSelected((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  };

  useEffect(() => {
    onChangeEvent(selected);
  }, [selected, onChangeEvent]);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-[200px] justify-start">
          {selected.length > 0
            ? selected
                .map((value) => options.find((o) => o.value === value)?.label)
                .join(", ")
            : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <Command>
          <CommandGroup>
            {options.map((option) => {
              const id = `checkbox-${option.value}`;
              return (
                <CommandItem
                  key={option.value}
                  onSelect={() => toggleItem(option.value)}
                  className="cursor-pointer"
                >
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <Checkbox
                      id={id}
                      checked={selected.includes(option.value)}
                    />
                    <span>{option.label}</span>
                  </label>
                </CommandItem>
              );
            })}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
};
