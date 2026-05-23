"use server";

import { logActivity } from "@/app/lib/log-activity";
import {
  AUCTION_ITEM_DETAILS_ROUTE_PATTERN,
  getActivityRouteView,
  INVENTORY_DETAILS_ROUTE_PATTERN,
  type ActivityRouteView,
} from "@/app/lib/activity-route-registry";
import { requireUser } from "@/app/lib/auth";
import { runWithUserContext } from "@/app/lib/protected-action";
import { GetAuctionItemDetailsController } from "src/controllers/inventories/get-auction-item-details.controller";
import { GetInventoryController } from "src/controllers/inventories/get-inventory.controller";

const getRouteViewDescription = async (routeView: ActivityRouteView) => {
  if (routeView.entity_id === AUCTION_ITEM_DETAILS_ROUTE_PATTERN) {
    const auctionInventoryId = routeView.params.auction_inventory_id;
    const auctionDate = routeView.params.auction_date;
    if (!auctionInventoryId || !auctionDate) return routeView.description;

    const res = await GetAuctionItemDetailsController(auctionInventoryId);
    if (!res.ok) return routeView.description;

    const { barcode, control } = res.value.inventory;
    return `Viewed auction > monitoring > ${barcode}:${control} for auction ${auctionDate}`;
  }

  if (routeView.entity_id === INVENTORY_DETAILS_ROUTE_PATTERN) {
    const containerBarcode = routeView.params.barcode;
    const inventoryId = routeView.params.inventory_id;
    if (!containerBarcode || !inventoryId) return routeView.description;

    const res = await GetInventoryController(inventoryId);
    if (!res.ok) return routeView.description;

    return `Viewed containers > ${containerBarcode} > inventories > ${res.value.barcode}:${res.value.control}`;
  }

  return routeView.description;
};

export const logRouteView = async (pathname: unknown) => {
  if (typeof pathname !== "string") return;

  const routeView = getActivityRouteView(pathname);
  if (!routeView) return;

  const user = await requireUser();

  await runWithUserContext(user, async () => {
    const description = await getRouteViewDescription(routeView);

    await logActivity(
      "CREATE",
      "route_view",
      routeView.entity_id,
      description,
    );
  });
};
