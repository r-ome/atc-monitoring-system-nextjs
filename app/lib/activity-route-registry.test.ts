import test from "node:test";
import assert from "node:assert/strict";

import { getActivityRouteView } from "./activity-route-registry";

test("getActivityRouteView maps static protected routes", () => {
  assert.deepEqual(getActivityRouteView("/containers"), {
    entity_id: "/containers",
    description: "Viewed containers",
  });

  assert.deepEqual(getActivityRouteView("/configurations/activity-logs"), {
    entity_id: "/configurations/activity-logs",
    description: "Viewed activity logs calendar",
  });
});

test("getActivityRouteView maps dynamic protected subroutes", () => {
  assert.deepEqual(
    getActivityRouteView("/auctions/2026-05-23/payments/OR-001/receipt"),
    {
      entity_id: "/auctions/[auction_date]/payments/[receipt_number]/receipt",
      description:
        "Viewed printable receipt OR-001 for auction 2026-05-23",
    },
  );

  assert.deepEqual(
    getActivityRouteView("/containers/32-04/inventories/inventory-1"),
    {
      entity_id: "/containers/[barcode]/inventories/[inventory_id]",
      description: "Viewed inventory item in container 32-04",
    },
  );
});

test("getActivityRouteView ignores unknown routes", () => {
  assert.equal(getActivityRouteView("/reports"), null);
  assert.equal(getActivityRouteView("/unknown"), null);
});
