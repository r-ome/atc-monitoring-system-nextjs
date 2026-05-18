import { formatDate } from "@/app/lib/utils";
import { logger } from "@/app/lib/logger";
import {
  DatabaseOperationError,
  InputParseError,
} from "src/entities/errors/common";
import {
  AuctionInventorySearchAuctionResult,
  AuctionInventorySearchInventoryResult,
  AuctionInventorySearchPage,
  AuctionInventorySearchRow,
  InventoryOnlySearchRow,
  parseAuctionInventorySearchInput,
} from "src/entities/models/Auction";
import { err, ok } from "src/entities/models/Result";
import { InventoryRepository } from "src/infrastructure/di/repositories";

const presenter = (
  auctionInventory: AuctionInventorySearchRow,
): AuctionInventorySearchAuctionResult => ({
  kind: "auction",
  auction_inventory_id: auctionInventory.auction_inventory_id,
  description: auctionInventory.description,
  status: auctionInventory.status,
  price: auctionInventory.price,
  qty: auctionInventory.qty,
  manifest_number: auctionInventory.manifest_number,
  auction_date: formatDate(auctionInventory.auction_date, "MMMM dd, yyyy"),
  created_at: formatDate(auctionInventory.created_at, "MMMM dd, yyyy"),
  inventory: {
    barcode: auctionInventory.inventory.barcode,
    control: auctionInventory.inventory.control || "NC",
    status: auctionInventory.inventory.status,
  },
  bidder: {
    bidder_number: auctionInventory.auction_bidder.bidder.bidder_number,
    full_name: `${auctionInventory.auction_bidder.bidder.first_name} ${auctionInventory.auction_bidder.bidder.last_name}`,
  },
});

const inventoryPresenter = (
  inventory: InventoryOnlySearchRow,
): AuctionInventorySearchInventoryResult => ({
  kind: "inventory",
  inventory_id: inventory.inventory_id,
  description: inventory.description,
  status: inventory.status,
  created_at: formatDate(inventory.created_at, "MMMM dd, yyyy"),
  inventory: {
    barcode: inventory.barcode,
    control: inventory.control || "NC",
    container_barcode: inventory.container.barcode,
  },
});

export const SearchAuctionItemsController = async (
  rawInput: string,
  offset = 0,
  limit = 20,
) => {
  try {
    let parsedInput;

    try {
      parsedInput = parseAuctionInventorySearchInput(rawInput);
    } catch (error) {
      throw new InputParseError("Invalid search input!", {
        cause: {
          search: [error instanceof Error ? error.message : "Invalid search input."],
        },
      });
    }

    const auctionInventories = await InventoryRepository.searchAuctionItems({
      input: parsedInput,
      offset,
      limit,
    });

    if (auctionInventories.length === 0 && offset === 0) {
      const inventories = await InventoryRepository.searchInventoryItems({
        input: parsedInput,
        offset,
        limit,
      });

      const page: AuctionInventorySearchPage = {
        items: inventories.slice(0, limit).map(inventoryPresenter),
        hasMore: inventories.length > limit,
      };

      return ok(page);
    }

    const page: AuctionInventorySearchPage = {
      items: auctionInventories.slice(0, limit).map(presenter),
      hasMore: auctionInventories.length > limit,
    };

    return ok(page);
  } catch (error) {
    if (error instanceof InputParseError) {
      logger("SearchAuctionItemsController", error, "warn");
      return err({ message: error.message, cause: error.cause });
    }

    logger("SearchAuctionItemsController", error);
    if (error instanceof DatabaseOperationError) {
      return err({ message: "Server Error", cause: error.message });
    }

    return err({
      message: "An error occurred! Please contact your admin!",
      cause: "Server Error",
    });
  }
};
