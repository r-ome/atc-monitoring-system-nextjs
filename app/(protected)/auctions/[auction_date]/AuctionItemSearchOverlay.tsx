"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import {
  getAuctionItemDetails,
  searchAuctionItems,
} from "@/app/(protected)/inventories/actions";
import { AuctionInventoryDetailsView } from "@/app/(protected)/auctions/[auction_date]/monitoring/[auction_inventory_id]/components/AuctionInventoryDetailsView";
import {
  AuctionsInventory,
  AuctionInventorySearchResult,
  parseAuctionInventorySearchInput,
} from "src/entities/models/Auction";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/app/components/ui/command";
import { Spinner } from "@/app/components/ui/spinner";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";

const TARGET_ROUTE_PATTERNS = [
  /^\/auctions\/[^/]+\/manifest$/,
  /^\/auctions\/[^/]+\/monitoring$/,
  /^\/auctions\/[^/]+\/registered-bidders\/[^/]+$/,
  /^\/bought-items$/,
  /^\/containers\/[^/]+$/,
];

const SEARCH_DEBOUNCE_MS = 300;

const isEditableTarget = (target: EventTarget | null) => {
  if (!(target instanceof HTMLElement)) return false;

  const tagName = target.tagName.toLowerCase();

  return (
    tagName === "input" ||
    tagName === "textarea" ||
    tagName === "select" ||
    target.isContentEditable
  );
};

const getSearchErrorMessage = (error: unknown) => {
  if (
    error &&
    typeof error === "object" &&
    "search" in error &&
    Array.isArray(error.search) &&
    typeof error.search[0] === "string"
  ) {
    return error.search[0];
  }

  if (typeof error === "string") {
    return error;
  }

  return null;
};

const getStatusVariant = (status: AuctionInventorySearchResult["status"]) =>
  status === "PARTIAL"
    ? "warning"
    : ["UNPAID", "CANCELLED"].includes(status)
      ? "destructive"
      : "success";

export const AuctionItemSearchOverlay = () => {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<AuctionInventorySearchResult[]>([]);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [selectedAuctionInventory, setSelectedAuctionInventory] =
    useState<AuctionsInventory | null>(null);
  const requestIdRef = useRef(0);

  const isEnabledRoute = useMemo(
    () => TARGET_ROUTE_PATTERNS.some((pattern) => pattern.test(pathname)),
    [pathname],
  );

  useEffect(() => {
    if (!isEnabledRoute) {
      setOpen(false);
    }
  }, [isEnabledRoute]);

  useEffect(() => {
    if (!isEnabledRoute) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() !== "k") return;
      if (!(event.metaKey || event.ctrlKey)) return;
      if (isEditableTarget(event.target)) return;

      event.preventDefault();
      setOpen((current) => !current);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isEnabledRoute]);

  useEffect(() => {
    setSelectedAuctionInventory(null);
    setDetailError(null);
  }, [query]);

  useEffect(() => {
    if (!open) return;

    const trimmedQuery = query.trim();

    if (!trimmedQuery) {
      requestIdRef.current += 1;
      setResults([]);
      setSearchError(null);
      setIsSearching(false);
      return;
    }

    const timeoutId = window.setTimeout(async () => {
      try {
        parseAuctionInventorySearchInput(trimmedQuery);
      } catch (error) {
        requestIdRef.current += 1;
        setResults([]);
        setSearchError(error instanceof Error ? error.message : "Invalid search input.");
        setIsSearching(false);
        return;
      }

      const requestId = requestIdRef.current + 1;
      requestIdRef.current = requestId;
      setIsSearching(true);
      setSearchError(null);

      const response = await searchAuctionItems(trimmedQuery);

      if (requestId !== requestIdRef.current) {
        return;
      }

      if (!response.ok) {
        setResults([]);
        setSearchError(
          getSearchErrorMessage(response.error.cause) ?? response.error.message,
        );
        setIsSearching(false);
        return;
      }

      setResults(response.value);
      setIsSearching(false);
    }, SEARCH_DEBOUNCE_MS);

    return () => window.clearTimeout(timeoutId);
  }, [open, query]);

  if (!isEnabledRoute) {
    return null;
  }

  const resetState = () => {
    requestIdRef.current += 1;
    setQuery("");
    setResults([]);
    setSearchError(null);
    setDetailError(null);
    setIsSearching(false);
    setIsLoadingDetail(false);
    setSelectedAuctionInventory(null);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);

    if (!nextOpen) {
      resetState();
    }
  };

  const handleSelectAuctionInventory = async (auctionInventoryId: string) => {
    setIsLoadingDetail(true);
    setDetailError(null);

    const response = await getAuctionItemDetails(auctionInventoryId);

    if (!response.ok) {
      setSelectedAuctionInventory(null);
      setDetailError(response.error.message);
      setIsLoadingDetail(false);
      return;
    }

    setSelectedAuctionInventory(response.value);
    setIsLoadingDetail(false);
  };

  return (
    <CommandDialog
      open={open}
      onOpenChange={handleOpenChange}
      title="Search auction item"
      description="Search auction items by barcode, control, or barcode:control."
      className="top-8 translate-y-0 sm:max-w-4xl"
    >
      <CommandInput
        value={query}
        onValueChange={setQuery}
        placeholder="Search barcode, control, or barcode:control"
        className="uppercase"
      />

      <div className="border-b px-3 py-2 text-muted-foreground text-xs">
        Accepted formats: <span className="font-mono">32-04-001</span>,{" "}
        <span className="font-mono">0007</span>, or{" "}
        <span className="font-mono">32-04-001:0007</span>
      </div>

      {selectedAuctionInventory ? (
        <div className="max-h-[70vh] overflow-y-auto p-4">
          <div className="mb-4 flex items-center justify-between gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setSelectedAuctionInventory(null)}
            >
              Back to results
            </Button>
            <div className="text-muted-foreground text-sm">
              {selectedAuctionInventory.inventory.barcode}:
              {selectedAuctionInventory.inventory.control}
            </div>
          </div>
          <AuctionInventoryDetailsView
            auctionInventory={selectedAuctionInventory}
          />
        </div>
      ) : (
        <div className="max-h-[70vh] overflow-y-auto">
          {detailError ? (
            <div className="px-4 py-6 text-center text-sm text-destructive">
              {detailError}
            </div>
          ) : null}

          {isLoadingDetail ? (
            <div className="flex items-center justify-center gap-2 px-4 py-8 text-sm text-muted-foreground">
              <Spinner />
              Loading auction item details...
            </div>
          ) : null}

          {!isLoadingDetail && !query.trim() ? (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">
              Start typing to search auction items in this branch.
            </div>
          ) : null}

          {!isLoadingDetail && searchError ? (
            <div className="px-4 py-6 text-center text-sm text-destructive">
              {searchError}
            </div>
          ) : null}

          {!isLoadingDetail && !searchError ? (
            <CommandList>
              {isSearching ? (
                <div className="flex items-center justify-center gap-2 px-4 py-8 text-sm text-muted-foreground">
                  <Spinner />
                  Searching auction items...
                </div>
              ) : null}

              {!isSearching && query.trim() ? (
                <CommandGroup
                  heading={`Matching auction items (${results.length})`}
                >
                  {results.map((item) => (
                    <CommandItem
                      key={item.auction_inventory_id}
                      value={`${item.inventory.barcode}:${item.inventory.control}`}
                      onSelect={() =>
                        handleSelectAuctionInventory(item.auction_inventory_id)
                      }
                      className="flex items-start justify-between gap-3"
                    >
                      <div className="flex min-w-0 flex-1 flex-col gap-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-sm">
                            {item.inventory.barcode}:{item.inventory.control}
                          </span>
                          <Badge variant={getStatusVariant(item.status)}>
                            {item.status}
                          </Badge>
                        </div>
                        <div className="truncate text-sm">{item.description}</div>
                        <div className="text-muted-foreground text-xs">
                          Bidder #{item.bidder.bidder_number} • {item.bidder.full_name}
                        </div>
                      </div>
                      <div className="text-muted-foreground text-right text-xs">
                        <div>{item.auction_date}</div>
                        <div>Manifest {item.manifest_number}</div>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              ) : null}

              {!isSearching && query.trim() && results.length === 0 ? (
                <CommandEmpty>No matching auction items found.</CommandEmpty>
              ) : null}
            </CommandList>
          ) : null}
        </div>
      )}
    </CommandDialog>
  );
};
