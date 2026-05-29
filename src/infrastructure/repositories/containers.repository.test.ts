import test, { afterEach } from "node:test";
import assert from "node:assert/strict";

import prisma from "@/app/lib/prisma/prisma";
import { ContainerRepository } from "./containers.repository";
import { ContainerHotItemCategoryRepository } from "./container-hot-item-categories.repository";
import { patchMethod } from "src/test-utils/patch";

const restorers: Array<() => void> = [];

afterEach(() => {
  while (restorers.length) {
    restorers.pop()?.();
  }
});

test("updateContainerStatus saves a paid date", async () => {
  let capturedData: { status: Date | null } | undefined;

  restorers.push(
    patchMethod(
      prisma.containers,
      "findFirst",
      (async () => ({ container_id: "container-1" })) as typeof prisma.containers.findFirst,
    ),
    patchMethod(
      prisma.containers,
      "update",
      (async ({ data }: { data: { status: Date | null } }) => {
        capturedData = data;
        return { container_id: "container-1", barcode: "32-04", ...data };
      }) as typeof prisma.containers.update,
    ),
  );

  await ContainerRepository.updateContainerStatus("container-1", "2026-05-02");

  assert.ok(capturedData?.status instanceof Date);
  assert.equal(capturedData.status.toISOString().slice(0, 10), "2026-05-02");
});

test("updateContainerStatus clears paid date when marked unpaid", async () => {
  let capturedData: { status: Date | null } | undefined;

  restorers.push(
    patchMethod(
      prisma.containers,
      "findFirst",
      (async () => ({ container_id: "container-1" })) as typeof prisma.containers.findFirst,
    ),
    patchMethod(
      prisma.containers,
      "update",
      (async ({ data }: { data: { status: Date | null } }) => {
        capturedData = data;
        return { container_id: "container-1", barcode: "32-04", ...data };
      }) as typeof prisma.containers.update,
    ),
  );

  await ContainerRepository.updateContainerStatus("container-1", null);

  assert.deepEqual(capturedData, { status: null });
});

test("uploadInventoryFile writes history rows for created inventories", async () => {
  const historyRows: Array<{
    inventory_id: string;
    auction_status: string;
    inventory_status: string;
    remarks: string;
  }> = [];

  const tx = {
    containers: {
      findMany: async () => [
        { container_id: "container-1", barcode: "32-04", status: null },
      ],
    },
    inventories: {
      create: async ({ data }: { data: { barcode: string } }) => ({
        inventory_id: `inventory-${data.barcode}`,
        ...data,
      }),
      updateMany: async () => ({ count: 0 }),
    },
    inventory_histories: {
      createMany: async ({ data }: { data: typeof historyRows }) => {
        historyRows.push(...data);
        return { count: data.length };
      },
    },
  };

  restorers.push(
    patchMethod(
      prisma,
      "$transaction",
      (async (...args: unknown[]) => {
        const callback = args[0];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return (callback as any)(tx);
      }) as typeof prisma.$transaction,
    ),
  );

  const result = await ContainerRepository.uploadInventoryFile({
    creates: [
      {
        container_id: "container-1",
        barcode: "32-04-001",
        control: "0001",
        description: "BAG",
        status: "UNSOLD",
      },
    ],
    updates: [],
    updated_by: "jerome",
  });

  assert.deepEqual(result, { created: 1, updated: 0 });
  assert.deepEqual(historyRows, [
    {
      inventory_id: "inventory-32-04-001",
      auction_status: "DISCREPANCY",
      inventory_status: "UNSOLD",
      remarks: "Inventory created from inventory file upload | Updated by: jerome",
    },
  ]);
});

test("getReportByContainerId totals only PAID hot item prices", async () => {
  restorers.push(
    patchMethod(
      prisma.containers,
      "findFirst",
      (async () => ({ container_id: "container-1" })) as typeof prisma.containers.findFirst,
    ),
    patchMethod(
      prisma.container_item_categories,
      "findMany",
      (async () => [
        {
          category_id: "category-1",
          container_id: "container-1",
          name: "Furniture",
          created_at: new Date(),
          updated_at: new Date(),
          deleted_at: null,
          descriptions: [
            {
              category_description_id: "description-1",
              category_id: "category-1",
              container_id: "container-1",
              description: "CHAIR",
              normalized_description: "CHAIR",
              created_at: new Date(),
              updated_at: new Date(),
            },
          ],
        },
      ]) as typeof prisma.container_item_categories.findMany,
    ),
    patchMethod(
      prisma.inventories,
      "findMany",
      (async () => [
        {
          inventory_id: "inventory-1",
          barcode: "20-04-001",
          control: "A1",
          description: "CHAIR",
          auctions_inventory: {
            status: "PAID",
            price: 1000,
            deleted_at: null,
          },
        },
        {
          inventory_id: "inventory-2",
          barcode: "20-04-002",
          control: null,
          description: "CHAIR",
          auctions_inventory: {
            status: "UNPAID",
            price: 5000,
            deleted_at: null,
          },
        },
        {
          inventory_id: "inventory-3",
          barcode: "20-04-003",
          control: "A3",
          description: "CHAIR",
          auctions_inventory: {
            status: "PAID",
            price: 2000,
            deleted_at: new Date(),
          },
        },
      ]) as unknown as typeof prisma.inventories.findMany,
    ),
  );

  const report =
    await ContainerHotItemCategoryRepository.getReportByContainerId(
      "container-1",
    );

  assert.equal(report.categories[0]?.total_items, 3);
  assert.equal(report.categories[0]?.paid_items, 1);
  assert.equal(report.categories[0]?.total_paid_price, 1000);
  assert.equal(report.available_descriptions[0]?.total_paid_price, 1000);
});

test("getReportByContainerId suggests categories for unassigned descriptions", async () => {
  restorers.push(
    patchMethod(
      prisma.containers,
      "findFirst",
      (async () => ({ container_id: "container-1" })) as typeof prisma.containers.findFirst,
    ),
    patchMethod(
      prisma.container_item_categories,
      "findMany",
      (async () => []) as unknown as typeof prisma.container_item_categories.findMany,
    ),
    patchMethod(
      prisma.inventories,
      "findMany",
      (async () => [
        {
          inventory_id: "inventory-1",
          barcode: "20-04-001",
          control: "T1",
          description: "TOOLS DI",
          auctions_inventory: {
            status: "PAID",
            price: 1000,
            deleted_at: null,
          },
        },
        {
          inventory_id: "inventory-2",
          barcode: "20-04-002",
          control: null,
          description: "TOOLS DI",
          auctions_inventory: {
            status: "UNPAID",
            price: 5000,
            deleted_at: null,
          },
        },
        {
          inventory_id: "inventory-3",
          barcode: "20-04-003",
          control: "C1",
          description: "CHAIR",
          auctions_inventory: {
            status: "PAID",
            price: 2000,
            deleted_at: null,
          },
        },
        {
          inventory_id: "inventory-4",
          barcode: "20-04-004",
          control: "C2",
          description: "CG DI",
          auctions_inventory: {
            status: "PAID",
            price: 3000,
            deleted_at: null,
          },
        },
      ]) as unknown as typeof prisma.inventories.findMany,
    ),
  );

  const report =
    await ContainerHotItemCategoryRepository.getReportByContainerId(
      "container-1",
    );

  assert.deepEqual(
    report.suggested_categories.map((category) => category.name),
    ["Furniture and fixtures", "Tools"],
  );
  assert.equal(report.suggested_categories[0]?.total_paid_price, 2000);
  assert.equal(report.suggested_categories[1]?.total_paid_price, 1000);
  assert.deepEqual(report.suggested_categories[1]?.descriptions, ["TOOLS DI"]);
});
