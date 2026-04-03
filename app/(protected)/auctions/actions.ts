"use server";

import { requireUser } from "@/app/lib/auth";
import { RequestContext } from "@/app/lib/prisma/RequestContext";
import { AuctionRepository } from "src/infrastructure/di/repositories";
import { GetAuctionController } from "src/controllers/auctions/get-auction.controller";
import { StartAuctionController } from "src/controllers/auctions/start-auction.controller";
import { RegisterBidderController } from "src/controllers/auctions/register-bidder.controller";
import { GetRegisteredBiddersController } from "src/controllers/auctions/get-registered-bidders.controller";
import { GetRegisteredBiddersSummaryController } from "src/controllers/auctions/get-registered-bidders-summary.controller";
import { GetMonitoringController } from "src/controllers/auctions/get-monitoring.controller";
import { UploadManifestController } from "src/controllers/auctions/upload-manifest.controller";
import { GetManifestRecordsController } from "src/controllers/auctions/get-manifest-records.controller";
import { GetRegisteredBidderController } from "src/controllers/auctions/get-registered-bidder.controller";
import { HandleBidderPullOutController } from "src/controllers/payments/handle-bidder-pullout.controller";
import { CancelItemsController } from "src/controllers/auctions/cancel-items.controller";
import { UploadCounterCheckController } from "src/controllers/auctions/upload-counter-check.controller";
import { GetCounterCheckController } from "src/controllers/auctions/get-counter-check.controller";
import { UpdateCounterCheckController } from "src/controllers/auctions/update-counter-check.controller";
import { UpdateManifestController } from "src/controllers/auctions/update-manifest.controller";
import { InsertAuctionInventoryController } from "src/controllers/auctions/insert-auction-inventory.controller";
import { UpdateBidderRegistrationController } from "src/controllers/auctions/update-bidder-registration.controller";
import { UnregisterBidderController } from "src/controllers/auctions/unregister-bidder.controller";
import { PreviewManifestController } from "src/controllers/auctions/preview-manifest.controller";
import { ConfirmUploadManifestController } from "src/controllers/auctions/confirm-upload-manifest.controller";
import { RevalidateManifestController } from "src/controllers/auctions/revalidate-manifest.controller";
import { type UploadManifestInput, type ManifestSheetRecord } from "src/entities/models/Manifest";
import { type PullOutPaymentInput } from "src/entities/models/Payment";

export const startAuction = async (auctionDate: string) => {
  const user = await requireUser();

  return await RequestContext.run(
    {
      branch_id: user.branch.branch_id,
      username: user.username ?? "",
      branch_name: user.branch.name ?? "",
    },
    async () => await StartAuctionController(auctionDate),
  );
};

export const getAuctionId = async (auctionDate: string) => {
  const user = await requireUser();

  return await RequestContext.run(
    { branch_id: user.branch.branch_id },
    async () => {
      const result = await AuctionRepository.getAuctionId(new Date(auctionDate));
      if (!result) {
        return { ok: false as const, error: { message: "Auction not found!" } };
      }
      return { ok: true as const, value: result.auction_id };
    },
  );
};

export const getAuction = async (auctionDate: string) => {
  const user = await requireUser();

  return await RequestContext.run(
    { branch_id: user.branch.branch_id },
    async () => await GetAuctionController(new Date(auctionDate)),
  );
};

export const registerBidder = async (input: FormData) => {
  const user = await requireUser();
  const data = Object.fromEntries(input.entries());
  data.payments = JSON.parse(data.payments as string);

  return await RequestContext.run(
    {
      branch_id: user.branch.branch_id,
      username: user.username ?? "",
      branch_name: user.branch.name ?? "",
    },
    async () => RegisterBidderController(data),
  );
};

export const getRegisteredBidders = async (auctionId: string) => {
  const user = await requireUser();

  return await RequestContext.run(
    { branch_id: user.branch.branch_id },
    async () => GetRegisteredBiddersController(auctionId),
  );
};

export const getRegisteredBiddersSummary = async (auctionId: string) => {
  const user = await requireUser();

  return await RequestContext.run(
    { branch_id: user.branch.branch_id },
    async () => GetRegisteredBiddersSummaryController(auctionId),
  );
};

export const getMonitoring = async (auctionId: string) => {
  const user = await requireUser();

  return await RequestContext.run(
    { branch_id: user.branch.branch_id },
    async () => await GetMonitoringController(auctionId),
  );
};

export const previewManifest = async (auctionId: string, formData: FormData) => {
  const user = await requireUser();
  const file = formData.get("file");

  return await RequestContext.run(
    { branch_id: user.branch.branch_id },
    async () => PreviewManifestController(auctionId, file as File),
  );
};

export const revalidateManifest = async (
  auctionId: string,
  data: ManifestSheetRecord[],
) => {
  const user = await requireUser();

  return await RequestContext.run(
    { branch_id: user.branch.branch_id },
    async () => RevalidateManifestController(auctionId, data),
  );
};

export const confirmUploadManifest = async (
  auctionId: string,
  data: UploadManifestInput[],
) => {
  const user = await requireUser();

  return await RequestContext.run(
    {
      branch_id: user.branch.branch_id,
      username: user.username ?? "",
      branch_name: user.branch.name ?? "",
    },
    async () => ConfirmUploadManifestController(auctionId, data),
  );
};

export const uploadManifest = async (auctionId: string, formData: FormData) => {
  const user = await requireUser();
  const file = formData.get("file");

  return await RequestContext.run(
    {
      branch_id: user.branch.branch_id,
      username: user.username ?? "",
      branch_name: user.branch.name ?? "",
    },
    async () => UploadManifestController(auctionId, file as File),
  );
};

export const getManifestRecords = async (auctionId: string) => {
  const user = await requireUser();

  return await RequestContext.run(
    { branch_id: user.branch.branch_id },
    async () => GetManifestRecordsController(auctionId),
  );
};

export const getRegisteredBidderByBidderNumber = async (
  bidderNumber: string,
  auctionDate: string,
) => {
  const user = await requireUser();

  return await RequestContext.run(
    { branch_id: user.branch.branch_id },
    async () => GetRegisteredBidderController(bidderNumber, auctionDate),
  );
};

export const handleBidderPullOut = async (input: PullOutPaymentInput) => {
  const user = await requireUser();

  return await RequestContext.run(
    {
      branch_id: user.branch.branch_id,
      username: user.username ?? "",
      branch_name: user.branch.name ?? "",
    },
    async () => HandleBidderPullOutController(input),
  );
};

export const cancelItems = async (formData: FormData) => {
  const user = await requireUser();
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

  return await RequestContext.run(
    {
      branch_id: user.branch.branch_id,
      username: user.username ?? "",
      branch_name: user.branch.name ?? "",
    },
    async () => CancelItemsController(input),
  );
};

export const uploadCounterCheck = async (
  auctionId: string,
  formData: FormData,
) => {
  const user = await requireUser();
  const file = formData.get("file");

  return await RequestContext.run(
    { branch_id: user.branch.branch_id },
    async () => UploadCounterCheckController(auctionId, file as File),
  );
};

export const getCounterCheck = async (auction_id: string) => {
  const user = await requireUser();

  return await RequestContext.run(
    { branch_id: user.branch.branch_id },
    async () => GetCounterCheckController(auction_id),
  );
};

export const updateCounterCheck = async (
  counterCheckId: string,
  formData: FormData,
) => {
  const user = await requireUser();
  const data = Object.fromEntries(formData.entries());

  return await RequestContext.run(
    { branch_id: user.branch.branch_id },
    async () => UpdateCounterCheckController(counterCheckId, data),
  );
};

export const updateManifest = async (
  auction_id: string,
  manifest_id: string,
  formData: FormData,
) => {
  const user = await requireUser();
  const data = Object.fromEntries(formData.entries());

  return await RequestContext.run(
    {
      branch_id: user.branch.branch_id,
      username: user.username ?? "",
      branch_name: user.branch.name ?? "",
    },
    async () => UpdateManifestController(auction_id, manifest_id, data),
  );
};

export const insertAuctionInventory = async (
  auction_id: string,
  formData: FormData,
) => {
  const user = await requireUser();
  const data = Object.fromEntries(formData.entries());

  return await RequestContext.run(
    {
      branch_id: user.branch.branch_id,
      username: user.username ?? "",
      branch_name: user.branch.name ?? "",
    },
    async () => InsertAuctionInventoryController(auction_id, data),
  );
};

export const updateBidderRegistration = async (
  auction_bidder_id: string,
  formData: FormData,
) => {
  const user = await requireUser();
  const data = Object.fromEntries(formData.entries());

  return await RequestContext.run(
    {
      branch_id: user.branch.branch_id,
      username: user.username ?? "",
      branch_name: user.branch.name ?? "",
    },
    async () => UpdateBidderRegistrationController(auction_bidder_id, data),
  );
};

export const unregisterBidder = async (auction_bidder_id: string) => {
  const user = await requireUser();

  return await RequestContext.run(
    {
      branch_id: user.branch.branch_id,
      username: user.username ?? "",
      branch_name: user.branch.name ?? "",
    },
    async () => UnregisterBidderController(auction_bidder_id),
  );
};
