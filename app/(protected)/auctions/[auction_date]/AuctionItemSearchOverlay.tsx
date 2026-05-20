"use client";

import { ChevronRightIcon, SearchIcon, XIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  getAuctionItemDetails,
  searchAuctionItems,
} from "@/app/(protected)/inventories/actions";
import { AuctionStatusPill } from "@/app/(protected)/auctions/components/AuctionStatusPill";
import { InventoryStatusBadge } from "@/app/components/admin";
import { AuctionInventoryDetailsView } from "@/app/(protected)/auctions/[auction_date]/monitoring/[auction_inventory_id]/components/AuctionInventoryDetailsView";
import {
  AuctionsInventory,
  AuctionInventorySearchAuctionResult,
  AuctionInventorySearchInventoryResult,
  AuctionInventorySearchResult,
  parseAuctionInventorySearchInput,
} from "src/entities/models/Auction";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/app/components/ui/dialog";
import { Spinner } from "@/app/components/ui/spinner";
import { Button } from "@/app/components/ui/button";
import { cn } from "@/app/lib/utils";

const SEARCH_DEBOUNCE_MS = 300;
const SEARCH_PAGE_SIZE = 20;

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

const formatPeso = (value: number) =>
  `₱${value.toLocaleString("en-PH", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;

const deriveContainer = (barcode: string) => {
  const segments = barcode.split("-");
  return segments.length >= 2 ? segments.slice(0, 2).join("-") : barcode;
};

type GroupedResults = Array<{
  container: string;
  items: AuctionInventorySearchResult[];
}>;

const groupByContainer = (
  items: AuctionInventorySearchResult[],
): GroupedResults => {
  const map = new Map<string, AuctionInventorySearchResult[]>();
  for (const item of items) {
    const barcode = item.inventory.barcode;
    const container = deriveContainer(barcode);
    if (!map.has(container)) map.set(container, []);
    map.get(container)!.push(item);
  }
  return Array.from(map.entries()).map(([container, items]) => ({
    container,
    items,
  }));
};

const Kbd = ({ children }: { children: React.ReactNode }) => (
  <kbd className="inline-flex h-5 min-w-5 items-center justify-center rounded border bg-secondary px-1.5 font-mono text-[14.5px] font-medium text-muted-foreground">
    {children}
  </kbd>
);

export const AuctionItemSearchOverlay = () => {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<AuctionInventorySearchResult[]>([]);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [selectedAuctionInventory, setSelectedAuctionInventory] =
    useState<AuctionsInventory | null>(null);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const requestIdRef = useRef(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const rowRefs = useRef<Array<HTMLButtonElement | null>>([]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() !== "k") return;
      if (!(event.metaKey || event.ctrlKey)) return;
      if (isEditableTarget(event.target)) return;

      event.preventDefault();
      setOpen((current) => !current);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

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
      setIsLoadingMore(false);
      setHasMore(false);
      return;
    }

    const timeoutId = window.setTimeout(async () => {
      try {
        parseAuctionInventorySearchInput(trimmedQuery);
      } catch (error) {
        requestIdRef.current += 1;
        setResults([]);
        setSearchError(
          error instanceof Error ? error.message : "Invalid search input.",
        );
        setIsSearching(false);
        setIsLoadingMore(false);
        setHasMore(false);
        return;
      }

      const requestId = requestIdRef.current + 1;
      requestIdRef.current = requestId;
      setIsSearching(true);
      setIsLoadingMore(false);
      setSearchError(null);

      const response = await searchAuctionItems(
        trimmedQuery,
        0,
        SEARCH_PAGE_SIZE,
      );

      if (requestId !== requestIdRef.current) {
        return;
      }

      if (!response.ok) {
        setResults([]);
        setSearchError(
          getSearchErrorMessage(response.error.cause) ?? response.error.message,
        );
        setIsSearching(false);
        setHasMore(false);
        return;
      }

      setResults(response.value.items);
      setHasMore(response.value.hasMore);
      setIsSearching(false);
    }, SEARCH_DEBOUNCE_MS);

    return () => window.clearTimeout(timeoutId);
  }, [open, query]);

  useEffect(() => {
    if (open && !selectedAuctionInventory) {
      // focus when the search list is showing (initial open or returning from profile)
      const id = window.setTimeout(() => inputRef.current?.focus(), 0);
      return () => window.clearTimeout(id);
    }
  }, [open, selectedAuctionInventory]);

  useEffect(() => {
    if (!selectedAuctionInventory) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Backspace") return;
      if (isEditableTarget(event.target)) return;
      event.preventDefault();
      setSelectedAuctionInventory(null);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selectedAuctionInventory]);

  const resetState = () => {
    requestIdRef.current += 1;
    setQuery("");
    setResults([]);
    setSearchError(null);
    setDetailError(null);
    setIsSearching(false);
    setIsLoadingMore(false);
    setIsLoadingDetail(false);
    setHasMore(false);
    setSelectedAuctionInventory(null);
    setHighlightedIndex(0);
  };

  useEffect(() => {
    setHighlightedIndex(0);
  }, [results]);

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

  const handleSelectInventoryOnly = (
    item: AuctionInventorySearchInventoryResult,
  ) => {
    setOpen(false);
    resetState();
    router.push(
      `/containers/${item.inventory.container_barcode}/inventories/${item.inventory_id}`,
    );
  };

  const handleLoadMore = async () => {
    const trimmedQuery = query.trim();
    if (!trimmedQuery || isLoadingMore || !hasMore) return;

    const requestId = requestIdRef.current;
    setIsLoadingMore(true);
    setSearchError(null);

    const response = await searchAuctionItems(
      trimmedQuery,
      results.length,
      SEARCH_PAGE_SIZE,
    );

    if (requestId !== requestIdRef.current) {
      return;
    }

    if (!response.ok) {
      setSearchError(
        getSearchErrorMessage(response.error.cause) ?? response.error.message,
      );
      setIsLoadingMore(false);
      return;
    }

    setResults((current) => [...current, ...response.value.items]);
    setHasMore(response.value.hasMore);
    setIsLoadingMore(false);
  };

  const grouped = useMemo(() => groupByContainer(results), [results]);
  const trimmed = query.trim();
  const hasQuery = trimmed.length > 0;

  const flatItems = useMemo(
    () => grouped.flatMap((group) => group.items),
    [grouped],
  );

  const openItemAt = (index: number) => {
    const item = flatItems[index];
    if (!item) return;
    if (item.kind === "auction") {
      handleSelectAuctionInventory(item.auction_inventory_id);
    } else {
      handleSelectInventoryOnly(item);
    }
  };

  const handleInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (flatItems.length === 0) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setHighlightedIndex((current) => {
        const next = Math.min(current + 1, flatItems.length - 1);
        rowRefs.current[next]?.scrollIntoView({ block: "nearest" });
        return next;
      });
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlightedIndex((current) => {
        const next = Math.max(current - 1, 0);
        rowRefs.current[next]?.scrollIntoView({ block: "nearest" });
        return next;
      });
    } else if (event.key === "Enter") {
      event.preventDefault();
      openItemAt(highlightedIndex);
    }
  };

  const highlightControl = useMemo(() => {
    if (!hasQuery) return false;
    try {
      const parsed = parseAuctionInventorySearchInput(trimmed);
      return parsed.mode === "control" || parsed.mode === "barcode_control";
    } catch {
      return false;
    }
  }, [trimmed, hasQuery]);

  return (
    <>
      <Button
        type="button"
        size="icon"
        aria-label="Search auction items"
        onClick={() => setOpen(true)}
        className="fixed bottom-20 left-4 z-50 h-12 w-12 rounded-full shadow-lg sm:hidden"
      >
        <SearchIcon className="size-5" />
      </Button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent
          showCloseButton={false}
          className={cn(
            "top-[72px] translate-y-0 overflow-hidden rounded-2xl border p-0 shadow-lg transition-[max-width] duration-150 sm:p-0",
            selectedAuctionInventory
              ? "sm:max-w-[860px]"
              : "sm:max-w-[820px]",
          )}
        >
          <DialogHeader className="sr-only">
            <DialogTitle>Search auction item</DialogTitle>
            <DialogDescription>
              Search auction items by barcode, control, or barcode:control.
            </DialogDescription>
          </DialogHeader>

          {selectedAuctionInventory ? (
            <div className="max-h-[85vh] overflow-y-auto">
              <AuctionInventoryDetailsView
                auctionInventory={selectedAuctionInventory}
                onBack={() => setSelectedAuctionInventory(null)}
                onClose={() => handleOpenChange(false)}
              />
            </div>
          ) : (
            <div className="flex max-h-[80vh] flex-col">
              {/* Search input */}
              <div className="flex items-center gap-3 border-b px-5 py-4">
                <SearchIcon className="size-[18px] shrink-0 text-muted-foreground" />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value.toUpperCase())}
                  onKeyDown={handleInputKeyDown}
                  placeholder="Search barcode, control, description, or barcode:control"
                  className="min-w-0 flex-1 border-0 bg-transparent text-[17.5px] text-foreground placeholder:text-muted-foreground focus:outline-none"
                />
                <Kbd>esc</Kbd>
                <button
                  type="button"
                  onClick={() => handleOpenChange(false)}
                  className="inline-flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground"
                  aria-label="Close"
                >
                  <XIcon className="size-3.5" />
                </button>
              </div>

              {/* Hint bar */}
              <div className="flex items-center justify-between gap-3 border-b bg-secondary/50 px-5 py-2.5 text-[15.5px] text-muted-foreground">
                <span>
                  Accepted formats:{" "}
                  <span className="font-mono text-foreground/80">32-04-001</span>
                  ,{" "}
                  <span className="font-mono text-foreground/80">0007</span>, or{" "}
                  <span className="font-mono text-foreground/80">
                    32-04-001:0007
                  </span>
                </span>
                <span className="hidden sm:inline">
                  Match:{" "}
                  <span className="font-mono text-foreground/80">barcode</span>{" "}
                  or{" "}
                  <span className="font-mono text-foreground/80">
                    barcode:control
                  </span>
                </span>
              </div>

              {/* Results */}
              <div className="min-h-0 flex-1 overflow-y-auto">
                {detailError ? (
                  <div className="px-5 py-6 text-center text-base text-destructive">
                    {detailError}
                  </div>
                ) : null}

                {isLoadingDetail ? (
                  <div className="flex items-center justify-center gap-2 px-5 py-10 text-base text-muted-foreground">
                    <Spinner />
                    Loading auction item details...
                  </div>
                ) : null}

                {!isLoadingDetail && !hasQuery ? (
                  <div className="px-5 py-10 text-center text-base text-muted-foreground">
                    Start typing to search auction items in this branch.
                  </div>
                ) : null}

                {!isLoadingDetail && searchError ? (
                  <div className="px-5 py-8 text-center text-base text-destructive">
                    {searchError}
                  </div>
                ) : null}

                {!isLoadingDetail && !searchError && hasQuery && isSearching ? (
                  <div className="flex items-center justify-center gap-2 px-5 py-10 text-base text-muted-foreground">
                    <Spinner />
                    Searching auction items...
                  </div>
                ) : null}

                {!isLoadingDetail &&
                !searchError &&
                hasQuery &&
                !isSearching &&
                results.length === 0 ? (
                  <div className="px-5 py-10 text-center text-base text-muted-foreground">
                    No matching auction or inventory items found.
                  </div>
                ) : null}

                {!isLoadingDetail &&
                !searchError &&
                hasQuery &&
                !isSearching &&
                results.length > 0
                  ? (() => {
                      let flatIndex = -1;
                      return grouped.map(({ container, items }, groupIndex) => (
                        <div key={container}>
                          <div
                            className={cn(
                              "flex items-center gap-2 bg-secondary/60 px-5 py-2 text-[15px] font-semibold tracking-wider text-muted-foreground uppercase",
                              groupIndex === 0 ? "" : "border-t",
                            )}
                          >
                            <span className="min-w-0 truncate">
                              Container{" "}
                              <span className="font-mono text-foreground/80">
                                {container}
                              </span>
                            </span>
                            <span className="shrink-0 whitespace-nowrap">
                              · {items.length}{" "}
                              {items.length === 1 ? "item" : "items"}
                            </span>
                          </div>
                          {items.map((item) => {
                            flatIndex += 1;
                            const currentIndex = flatIndex;
                            const isHighlighted =
                              currentIndex === highlightedIndex;
                            const refCallback = (
                              el: HTMLButtonElement | null,
                            ) => {
                              rowRefs.current[currentIndex] = el;
                            };
                            if (item.kind === "auction") {
                              return (
                                <AuctionResultRow
                                  key={item.auction_inventory_id}
                                  item={item}
                                  highlight={isHighlighted}
                                  highlightControl={highlightControl}
                                  rowRef={refCallback}
                                  onMouseEnter={() =>
                                    setHighlightedIndex(currentIndex)
                                  }
                                  onSelect={() =>
                                    handleSelectAuctionInventory(
                                      item.auction_inventory_id,
                                    )
                                  }
                                />
                              );
                            }
                            return (
                              <InventoryResultRow
                                key={item.inventory_id}
                                item={item}
                                highlight={isHighlighted}
                                highlightControl={highlightControl}
                                rowRef={refCallback}
                                onMouseEnter={() =>
                                  setHighlightedIndex(currentIndex)
                                }
                                onSelect={() => handleSelectInventoryOnly(item)}
                              />
                            );
                          })}
                        </div>
                      ));
                    })()
                  : null}

                {!isSearching && hasMore ? (
                  <div className="border-t p-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      onClick={handleLoadMore}
                      disabled={isLoadingMore}
                    >
                      {isLoadingMore ? "Loading..." : "Load more"}
                    </Button>
                  </div>
                ) : null}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between gap-3 border-t bg-secondary/50 px-5 py-2.5 text-[17.5px] text-muted-foreground">
                <div className="hidden flex-wrap items-center gap-3 sm:flex">
                  <span className="inline-flex items-center gap-1.5">
                    <Kbd>↑</Kbd>
                    <Kbd>↓</Kbd> navigate
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Kbd>↵</Kbd> open
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Kbd>esc</Kbd> close
                  </span>
                </div>
                <span className="shrink-0 whitespace-nowrap">
                  {hasQuery
                    ? `${results.length}${hasMore ? "+" : ""} ${results.length === 1 ? "result" : "results"}`
                    : ""}
                </span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

const RowShell = ({
  highlight,
  onSelect,
  onMouseEnter,
  rowRef,
  children,
}: {
  highlight: boolean;
  onSelect: () => void;
  onMouseEnter?: () => void;
  rowRef?: (el: HTMLButtonElement | null) => void;
  children: React.ReactNode;
}) => (
  <button
    ref={rowRef}
    type="button"
    onClick={onSelect}
    onMouseEnter={onMouseEnter}
    className={cn(
      "grid w-full grid-cols-[110px_1fr_auto_18px] items-center gap-3 border-b px-5 py-2.5 text-left transition-colors sm:grid-cols-[110px_1fr_72px_90px_96px_18px]",
      highlight ? "bg-primary/10" : "hover:bg-secondary/60",
    )}
  >
    {children}
  </button>
);

const ControlCode = ({
  control,
  highlight,
}: {
  control: string;
  highlight: boolean;
}) => (
  <span
    className={cn(
      "font-mono",
      highlight
        ? "rounded bg-primary/15 px-1 py-0.5 font-semibold text-primary"
        : "text-foreground/80",
    )}
  >
    {control}
  </span>
);

const AuctionResultRow = ({
  item,
  highlight,
  highlightControl,
  onSelect,
  onMouseEnter,
  rowRef,
}: {
  item: AuctionInventorySearchAuctionResult;
  highlight: boolean;
  highlightControl: boolean;
  onSelect: () => void;
  onMouseEnter?: () => void;
  rowRef?: (el: HTMLButtonElement | null) => void;
}) => (
  <RowShell
    highlight={highlight}
    onSelect={onSelect}
    onMouseEnter={onMouseEnter}
    rowRef={rowRef}
  >
    <div className="min-w-0">
      <div className="font-mono text-[14.5px] font-medium text-foreground">
        {item.inventory.barcode}
      </div>
      <div className="mt-0.5 text-[13px] text-muted-foreground">
        <ControlCode
          control={item.inventory.control}
          highlight={highlightControl}
        />
      </div>
    </div>
    <div className="min-w-0">
      <div className="truncate text-[15px] font-medium text-foreground">
        {item.description}
      </div>
      <div className="mt-0.5 text-[15px] text-muted-foreground">
        Manifest{" "}
        <span className="font-mono text-foreground/80">
          {item.manifest_number}
        </span>
      </div>
    </div>
    <div className="hidden font-mono text-[17.5px] text-muted-foreground sm:block">
      #{item.bidder.bidder_number}
    </div>
    <div className="hidden text-right font-mono text-[14.5px] text-foreground/80 sm:block">
      {formatPeso(item.price)}
    </div>
    <div className="justify-self-start">
      <AuctionStatusPill status={item.status} size="sm" />
    </div>
    <ChevronRightIcon className="size-3.5 text-muted-foreground/70" />
  </RowShell>
);

const InventoryResultRow = ({
  item,
  highlight,
  highlightControl,
  onSelect,
  onMouseEnter,
  rowRef,
}: {
  item: AuctionInventorySearchInventoryResult;
  highlight: boolean;
  highlightControl: boolean;
  onSelect: () => void;
  onMouseEnter?: () => void;
  rowRef?: (el: HTMLButtonElement | null) => void;
}) => (
  <RowShell
    highlight={highlight}
    onSelect={onSelect}
    onMouseEnter={onMouseEnter}
    rowRef={rowRef}
  >
    <div className="min-w-0">
      <div className="font-mono text-[14.5px] font-medium text-foreground">
        {item.inventory.barcode}
      </div>
      <div className="mt-0.5 text-[13px] text-muted-foreground">
        <ControlCode
          control={item.inventory.control}
          highlight={highlightControl}
        />
      </div>
    </div>
    <div className="min-w-0">
      <div className="truncate text-[15px] font-medium text-foreground">
        {item.description}
      </div>
      <div className="mt-0.5 text-[15px] text-muted-foreground">
        Not in any auction · Container{" "}
        <span className="font-mono text-foreground/80">
          {item.inventory.container_barcode}
        </span>
      </div>
    </div>
    <div className="hidden font-mono text-[17.5px] text-muted-foreground sm:block">
      —
    </div>
    <div className="hidden text-right font-mono text-[14.5px] text-muted-foreground sm:block">
      —
    </div>
    <div className="justify-self-start">
      <InventoryStatusBadge status={item.status} size="sm" />
    </div>
    <ChevronRightIcon className="size-3.5 text-muted-foreground/70" />
  </RowShell>
);
