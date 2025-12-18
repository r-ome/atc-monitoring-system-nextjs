"use client";

import { Input } from "@/app/components/ui/input";

export type SearchComponentProps = {
  value?: string;
  onChangeEvent: (value: string) => void;
  placeholder?: string;
};

export const SearchComponent: React.FC<SearchComponentProps> = ({
  value,
  onChangeEvent,
  placeholder = "Search here...",
}) => (
  <Input
    value={value}
    placeholder={placeholder}
    className="w-full"
    onChange={(event) => onChangeEvent(event.target.value)}
  />
);
