import test from "node:test";
import assert from "node:assert/strict";

import { getActivityRouteView } from "./activity-route-registry";

test("getActivityRouteView maps static protected routes", () => {
  assert.deepEqual(getActivityRouteView("/containers"), {
    entity_id: "/containers",
    description: "Viewed containers",
    params: {},
  });

  assert.deepEqual(getActivityRouteView("/configurations/activity-logs"), {
    entity_id: "/configurations/activity-logs",
    description: "Viewed configurations > activity logs",
    params: {},
  });
});

test("getActivityRouteView maps dynamic protected subroutes", () => {
  assert.deepEqual(
    getActivityRouteView("/auctions/2026-05-23/payments/OR-001/receipt"),
    {
      entity_id: "/auctions/[auction_date]/payments/[receipt_number]/receipt",
      description:
        "Viewed auction > payments > OR-001 > printable receipt for auction 2026-05-23",
      params: {
        auction_date: "2026-05-23",
        receipt_number: "OR-001",
      },
    },
  );

  assert.deepEqual(
    getActivityRouteView("/containers/32-04/inventories/inventory-1"),
    {
      entity_id: "/containers/[barcode]/inventories/[inventory_id]",
      description: "Viewed containers > 32-04 > inventories > inventory-1",
      params: {
        barcode: "32-04",
        inventory_id: "inventory-1",
      },
    },
  );

  assert.deepEqual(
    getActivityRouteView("/auctions/2026-05-23/monitoring/auction-item-1"),
    {
      entity_id: "/auctions/[auction_date]/monitoring/[auction_inventory_id]",
      description:
        "Viewed auction > monitoring > item details for auction 2026-05-23",
      params: {
        auction_date: "2026-05-23",
        auction_inventory_id: "auction-item-1",
      },
    },
  );
});

test("getActivityRouteView ignores unknown routes", () => {
  assert.equal(getActivityRouteView("/reports"), null);
  assert.equal(getActivityRouteView("/unknown"), null);
});
