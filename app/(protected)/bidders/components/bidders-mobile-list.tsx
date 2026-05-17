"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpDown, Search } from "lucide-react";
import { Input } from "@/app/components/ui/input";
import { Button } from "@/app/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import { BranchBadge, StatusBadge } from "@/app/components/admin";
import type { BidderRowType } from "./bidders-table";

type SortKey = "bidder_number" | "full_name" | "last_active";
type SortDir = "asc" | "desc";

const PAGE_SIZE = 25;

interface Props {
  bidders: BidderRowType[];
  branchOptions: { value: string; label: string }[];
}

export function BiddersMobileList({ bidders, branchOptions }: Props) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [branch, setBranch] = useState<string>("all");
  const [sortKey, setSortKey] = useState<SortKey>("bidder_number");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [visible, setVisible] = useState(PAGE_SIZE);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const rows = bidders.filter((b) => {
      if (branch !== "all" && b.branch.name !== branch) return false;
      if (!q) return true;
      return (
        b.full_name.toLowerCase().includes(q) ||
        b.bidder_number.toLowerCase().includes(q) ||
        (b.birthdate?.toLowerCase().includes(q) ?? false)
      );
    });

    rows.sort((a, b) => {
      const dir = sortDir === "asc" ? 1 : -1;
      if (sortKey === "bidder_number") {
        return a.bidder_number.localeCompare(b.bidder_number, undefined, {
          numeric: true,
        }) * dir;
      }
      if (sortKey === "full_name") {
        return a.full_name.localeCompare(b.full_name) * dir;
      }
      const av = a.last_active.auction;
      const bv = b.last_active.auction;
      if (!av && !bv) return 0;
      if (!av) return 1;
      if (!bv) return -1;
      return (new Date(av).getTime() - new Date(bv).getTime()) * dir;
    });

    return rows;
  }, [bidders, search, branch, sortKey, sortDir]);

  const shown = filtered.slice(0, visible);

  return (
    <div className="flex flex-col">
      {/* Toolbar */}
      <div className="mb-3 flex flex-col gap-2">
        <div className="relative">
          <Search
            size={14}
            className="absolute top-1/2 left-2.5 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setVisible(PAGE_SIZE);
            }}
            placeholder="Search by name or bidder #"
            className="h-9 pl-8 text-[13px]"
          />
        </div>
        <div className="flex gap-2">
          <Select
            value={branch}
            onValueChange={(v) => {
              setBranch(v);
              setVisible(PAGE_SIZE);
            }}
          >
            <SelectTrigger className="h-9 flex-1 text-[13px]">
              <SelectValue placeholder="All branches" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All branches</SelectItem>
              {branchOptions.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={`${sortKey}:${sortDir}`}
            onValueChange={(v) => {
              const [k, d] = v.split(":") as [SortKey, SortDir];
              setSortKey(k);
              setSortDir(d);
            }}
          >
            <SelectTrigger className="h-9 w-[148px] text-[13px]">
              <ArrowUpDown size={14} className="text-muted-foreground" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="bidder_number:asc">Bidder # ↑</SelectItem>
              <SelectItem value="bidder_number:desc">Bidder # ↓</SelectItem>
              <SelectItem value="full_name:asc">Name A–Z</SelectItem>
              <SelectItem value="full_name:desc">Name Z–A</SelectItem>
              <SelectItem value="last_active:desc">Last active (recent)</SelectItem>
              <SelectItem value="last_active:asc">Last active (oldest)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* List */}
      {shown.length === 0 ? (
        <div className="py-8 text-center text-[13px] text-muted-foreground">
          No bidders match your filters.
        </div>
      ) : (
        <ul className="divide-y divide-border border-y border-border">
          {shown.map((b) => {
            const lastActive = b.last_active.duration ?? "Never";
            return (
              <li key={b.bidder_id}>
                <button
                  type="button"
                  onClick={() =>
                    router.push(
                      `/bidders/${b.bidder_number}-${b.branch.name}`
                    )
                  }
                  className="flex w-full items-center gap-3 px-1 py-3 text-left hover:bg-secondary/50"
                >
                  <span className="font-mono min-w-[52px] text-[13px] font-semibold">
                    #{b.bidder_number}
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block truncate text-[13px] font-medium uppercase">
                      {b.full_name}
                    </span>
                    <span className="mt-0.5 flex items-center gap-1.5 text-[11.5px] text-muted-foreground">
                      <BranchBadge branch={b.branch.name} />
                      <span aria-hidden>·</span>
                      <span className="truncate">{lastActive}</span>
                    </span>
                  </span>
                  <StatusBadge
                    variant={b.status === "ACTIVE" ? "active" : "inactive"}
                  >
                    {b.status}
                  </StatusBadge>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {/* Footer: count + load more */}
      <div className="mt-3 flex items-center justify-between text-[12px] text-muted-foreground">
        <span>
          Showing {shown.length.toLocaleString()} of{" "}
          {filtered.length.toLocaleString()}
        </span>
        {visible < filtered.length ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setVisible((v) => v + PAGE_SIZE)}
          >
            Load more
          </Button>
        ) : null}
      </div>
    </div>
  );
}
