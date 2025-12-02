"use server";

import { GetAuctionController } from "src/controllers/auctions/get-auction.controller";
import { StartAuctionController } from "src/controllers/auctions/start-auction.controller";
import { RegisterBidderController } from "src/controllers/auctions/register-bidder.controller";
import { GetRegisteredBiddersController } from "src/controllers/auctions/get-registered-bidders.controller";
import { GetMonitoringController } from "src/controllers/auctions/get-monitoring.controller";
import { UploadManifestController } from "src/controllers/auctions/upload-manifest.controller";
import { GetManifestRecordsController } from "src/controllers/auctions/get-manifest-records.controller";
import { GetRegisteredBidderController } from "src/controllers/auctions/get-registered-bidder.controller";
import { HandleBidderPullOutController } from "src/controllers/payments/handle-bidder-pullout.controllers";
import { CancelItemsController } from "src/controllers/auctions/cancel-items.controller";
import { UploadCounterCheckController } from "src/controllers/auctions/upload-counter-check.controller";
import { GetCounterCheckController } from "src/controllers/auctions/get-counter-check.controller";
import { UpdateCounterCheckController } from "src/controllers/auctions/update-counter-check.controller";
import { UpdateManifestController } from "src/controllers/auctions/update-manifest.controller";
import { InsertAuctionInventoryController } from "src/controllers/auctions/insert-auction-inventory.controller";
import { UpdateBidderRegistrationController } from "src/controllers/auctions/update-bidder-registration.controller";
import { UnregisterBidderController } from "src/controllers/auctions/unregister-bidder.controller";

export const startAuction = async (auctionDate: string) => {
  return await StartAuctionController(auctionDate);
};

export const getAuction = async (auctionDate: string) => {
  return await GetAuctionController(new Date(auctionDate));
};

export const registerBidder = async (input: FormData) => {
  const data = Object.fromEntries(input.entries());
  data.payments = JSON.parse(data.payments as string);

  return await RegisterBidderController(data);
};

export const getRegisteredBidders = async (auctionId: string) => {
  return await GetRegisteredBiddersController(auctionId);
};

export const getMonitoring = async (auctionId: string) => {
  return await GetMonitoringController(auctionId);
};

export const uploadManifest = async (auctionId: string, formData: FormData) => {
  const file = formData.get("file");
  return await UploadManifestController(auctionId, file as File);
};

export const getManifestRecords = async (auctionId: string) => {
  return await GetManifestRecordsController(auctionId);
};

export const getRegisteredBidderByBidderNumber = async (
  bidderNumber: string,
  auctionDate: string
) => {
  return await GetRegisteredBidderController(bidderNumber, auctionDate);
};

export const handleBidderPullOut = async (formData: FormData) => {
  const data = Object.fromEntries(formData.entries());
  data.payments = JSON.parse(data.payments as string);
  data.auction_inventory_ids = JSON.parse(data.auction_inventory_ids as string);
  return await HandleBidderPullOutController(data);
};

export const cancelItems = async (formData: FormData) => {
  const data = Object.fromEntries(formData.entries());

  const auction_inventory_ids =
    typeof data.auction_inventories === "string"
      ? (
          JSON.parse(data.auction_inventories) as {
            auction_inventory_id: string;
          }[]
        ).map((item) => item.auction_inventory_id)
      : [];

  const inventory_ids =
    typeof data.auction_inventories === "string"
      ? (
          JSON.parse(data.auction_inventories) as { inventory_id: string }[]
        ).map((item) => item.inventory_id)
      : [];

  const input = {
    auction_bidder_id: data.auction_bidder_id as string,
    auction_inventory_ids,
    inventory_ids,
    reason: (data.reason as string).toUpperCase(),
  };

  return await CancelItemsController(input);
};

export const uploadCounterCheck = async (
  auctionId: string,
  formData: FormData
) => {
  const file = formData.get("file");
  return await UploadCounterCheckController(auctionId, file as File);
};

export const getCounterCheck = async (auction_id: string) => {
  return await GetCounterCheckController(auction_id);
};

export const updateCounterCheck = async (
  counterCheckId: string,
  formData: FormData
) => {
  const data = Object.fromEntries(formData.entries());
  return await UpdateCounterCheckController(counterCheckId, data);
};

export const updateManifest = async (
  auction_id: string,
  manifest_id: string,
  formData: FormData
) => {
  const data = Object.fromEntries(formData.entries());
  return await UpdateManifestController(auction_id, manifest_id, data);
};

export const insertAuctionInventory = async (
  auction_id: string,
  formData: FormData
) => {
  const data = Object.fromEntries(formData.entries());
  return await InsertAuctionInventoryController(auction_id, data);
};

export const updateBidderRegistration = async (
  auction_bidder_id: string,
  formData: FormData
) => {
  const data = Object.fromEntries(formData.entries());
  return await UpdateBidderRegistrationController(auction_bidder_id, data);
};

export const unregisterBidder = async (auction_bidder_id: string) => {
  return await UnregisterBidderController(auction_bidder_id);
};
