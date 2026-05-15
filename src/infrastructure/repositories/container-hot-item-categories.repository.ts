import prisma from "@/app/lib/prisma/prisma";
import { buildTenantWhere } from "@/app/lib/prisma/tenant-where";
import {
  isPrismaError,
  isPrismaValidationError,
} from "@/app/lib/error-handler";
import { IContainerHotItemCategoryRepository } from "src/application/repositories/container-hot-item-categories.repository.interface";
import {
  DatabaseOperationError,
  InputParseError,
  NotFoundError,
} from "src/entities/errors/common";
import {
  ContainerHotItemAvailableDescription,
  ContainerHotItemCategoryReport,
  ContainerHotItemReport,
  ContainerHotItemReportItem,
  ContainerHotItemSuggestedCategory,
  normalizeHotItemDescription,
} from "src/entities/models/ContainerHotItemCategory";

type InventoryReportRow = {
  inventory_id: string;
  barcode: string;
  control: string | null;
  description: string;
  auctions_inventory: {
    status: string;
    price: number;
    deleted_at: Date | null;
  } | null;
};

const SUGGESTED_CATEGORY_RULES: Array<{
  name: string;
  keywords: string[];
}> = [
  {
    name: "Gift sets",
    keywords: ["INBOX DI", "IN BOX DI"],
  },
  {
    name: "Tools",
    keywords: ["TOOLS", "TOOL BOX", "COMPRESSOR", "SAND PAPER", "SHOVEL"],
  },
  {
    name: "Cooking ware",
    keywords: ["CW"],
  },
  {
    name: "Kitchenware",
    keywords: [
      "KW",
      "KWL",
      "ARCOPAL",
      "CANISTER",
      "BENTO",
      "STAINLESS",
      "S.S",
      "SPOON & FORK",
      "COOLER",
      "GW",
    ],
  },
  {
    name: "Bags and luggage",
    keywords: ["BAG", "LUGGAGE", "POUCH"],
  },
  {
    name: "Furniture and fixtures",
    keywords: [
      "CHAIR",
      "TABLE",
      "DRAWER",
      "CAB",
      "LATERAL",
      "CLOSET",
      "SOFA",
      "BED",
      "SHELVES",
      "BENCH",
      "FOOTREST",
      "CRIB",
      "RECLINING",
      "DISPLAYER",
      "MIRROR",
      "RACK",
      "DRESSER",
      "MATTRESS",
      "FOAM",
    ],
  },
  {
    name: "Electronics and appliances",
    keywords: [
      "REF",
      "WASHING",
      "S. MACHINE",
      "STEREO",
      "AMP",
      "SPEAKER",
      "KEY BOARD",
      "TEL",
      "COMPONENT",
      "CD",
      "EI",
    ],
  },
  {
    name: "Musical instruments",
    keywords: ["PIANO", "GUITAR"],
  },
  {
    name: "Fashion and accessories",
    keywords: [
      "WATCH",
      "ACCESSORIES",
      "PERFUME",
      "EYEGLASSES",
      "SHOES",
      "BELT",
    ],
  },
  {
    name: "Decor",
    keywords: [
      "VASE",
      "FIG",
      "FRAME",
      "MARBLE",
      "METAL",
      "WOOD",
      "STONE",
      "SCULPTURE",
      "CLOCK",
      "ASHTRAY",
    ],
  },
  {
    name: "Toys, sports and mobility",
    keywords: [
      "TOY",
      "SPORTS",
      "EXERCISER",
      "SCOOTER",
      "BIKE",
      "HELMET",
      "WHEEL CHAIR",
      "CANE",
      "FISHING",
      "GOLF",
      "SKII",
    ],
  },
];

function dedupeDescriptions(descriptions: string[]) {
  const seen = new Set<string>();
  return descriptions.flatMap((description) => {
    const normalized = normalizeHotItemDescription(description);
    if (seen.has(normalized)) return [];
    seen.add(normalized);
    return [{ description, normalized_description: normalized }];
  });
}

function getSuggestedCategoryName(description: string): string | null {
  const normalized = normalizeHotItemDescription(description);

  for (const rule of SUGGESTED_CATEGORY_RULES) {
    if (rule.keywords.some((keyword) => normalized.includes(keyword))) {
      return rule.name;
    }
  }

  return null;
}

function presentInventoryItem(
  inventory: InventoryReportRow,
): ContainerHotItemReportItem {
  const auctionInventory = inventory.auctions_inventory;
  return {
    inventory_id: inventory.inventory_id,
    barcode: inventory.barcode,
    control: inventory.control ?? "NC",
    description: inventory.description,
    status:
      auctionInventory && !auctionInventory.deleted_at
        ? auctionInventory.status
        : null,
    price:
      auctionInventory && !auctionInventory.deleted_at
        ? auctionInventory.price
        : 0,
  };
}

function buildSuggestedCategories({
  availableDescriptions,
  inventories,
}: {
  availableDescriptions: ContainerHotItemAvailableDescription[];
  inventories: InventoryReportRow[];
}) {
  const suggestions = new Map<string, ContainerHotItemSuggestedCategory>();
  const unassignedDescriptions = new Set(
    availableDescriptions.flatMap((description) => {
      if (description.category_id !== null) return [];
      return [description.normalized_description];
    }),
  );

  for (const availableDescription of availableDescriptions) {
    if (availableDescription.category_id !== null) continue;

    const name = getSuggestedCategoryName(availableDescription.description);
    if (!name) continue;

    const current = suggestions.get(name) ?? {
      name,
      descriptions: [],
      total_items: 0,
      paid_items: 0,
      total_paid_price: 0,
      items: [],
    };

    current.descriptions.push(availableDescription.description);
    current.total_items += availableDescription.total_items;
    current.paid_items += availableDescription.paid_items;
    current.total_paid_price += availableDescription.total_paid_price;
    suggestions.set(name, current);
  }

  for (const inventory of inventories) {
    const normalized = normalizeHotItemDescription(inventory.description);
    if (!unassignedDescriptions.has(normalized)) continue;

    const name = getSuggestedCategoryName(inventory.description);
    if (!name) continue;

    suggestions.get(name)?.items.push(presentInventoryItem(inventory));
  }

  return Array.from(suggestions.values()).sort(
    (a, b) => b.total_paid_price - a.total_paid_price,
  );
}

function handleError(context: string, error: unknown): never {
  if (isPrismaError(error) || isPrismaValidationError(error)) {
    throw new DatabaseOperationError(context, {
      cause: (error as Error).message,
    });
  }

  throw error;
}

async function getContainer(container_id: string) {
  const container = await prisma.containers.findFirst({
    where: buildTenantWhere("containers", { container_id }),
    select: { container_id: true },
  });

  if (!container) {
    throw new NotFoundError("Container not found!");
  }

  return container;
}

async function validateCategoryName(
  container_id: string,
  name: string,
  current_category_id?: string,
) {
  const categories = await prisma.container_item_categories.findMany({
    where: buildTenantWhere("container_item_categories", {
      container_id,
      deleted_at: null,
    }),
    select: { category_id: true, name: true },
  });
  const normalizedName = normalizeHotItemDescription(name);
  const duplicate = categories.find(
    (category) =>
      category.category_id !== current_category_id &&
      normalizeHotItemDescription(category.name) === normalizedName,
  );

  if (duplicate) {
    throw new InputParseError("Category name already exists!", {
      cause: { name: ["Category name already exists."] },
    });
  }
}

async function validateDescriptions(
  container_id: string,
  descriptions: ReturnType<typeof dedupeDescriptions>,
  current_category_id?: string,
) {
  if (descriptions.length === 0) return;

  const inventoryDescriptions = await prisma.inventories.findMany({
    where: buildTenantWhere("inventories", {
      container_id,
      deleted_at: null,
    }),
    select: { description: true },
    distinct: ["description"],
  });
  const allowed = new Set(
    inventoryDescriptions.map((item) =>
      normalizeHotItemDescription(item.description),
    ),
  );
  const missing = descriptions.filter(
    (item) => !allowed.has(item.normalized_description),
  );

  if (missing.length) {
    throw new InputParseError("Invalid item descriptions!", {
      cause: {
        descriptions: missing.map(
          (item) => `${item.description} is not in this container.`,
        ),
      },
    });
  }

  const assignedDescriptions =
    await prisma.container_item_category_descriptions.findMany({
      where: buildTenantWhere("container_item_category_descriptions", {
        container_id,
        normalized_description: {
          in: descriptions.map((item) => item.normalized_description),
        },
        category_id: current_category_id
          ? { not: current_category_id }
          : undefined,
      }),
      include: { category: true },
    });

  if (assignedDescriptions.length) {
    throw new InputParseError("Item description already assigned!", {
      cause: {
        descriptions: assignedDescriptions.map(
          (item) =>
            `${item.description} is already assigned to ${item.category.name}.`,
        ),
      },
    });
  }
}

export const ContainerHotItemCategoryRepository: IContainerHotItemCategoryRepository =
  {
    getReportByContainerId: async (container_id) => {
      try {
        await getContainer(container_id);

        const [categories, inventories] = await Promise.all([
          prisma.container_item_categories.findMany({
            where: buildTenantWhere("container_item_categories", {
              container_id,
              deleted_at: null,
            }),
            include: { descriptions: true },
            orderBy: { name: "asc" },
          }),
          prisma.inventories.findMany({
            where: buildTenantWhere("inventories", {
              container_id,
              deleted_at: null,
            }),
            select: {
              inventory_id: true,
              barcode: true,
              control: true,
              description: true,
              auctions_inventory: {
                select: {
                  status: true,
                  price: true,
                  deleted_at: true,
                },
              },
            },
            orderBy: { barcode: "asc" },
          }),
        ]);

        const assignedByDescription = new Map<
          string,
          { category_id: string; category_name: string }
        >();
        for (const category of categories) {
          for (const description of category.descriptions) {
            assignedByDescription.set(description.normalized_description, {
              category_id: category.category_id,
              category_name: category.name,
            });
          }
        }

        const availableDescriptionMap = new Map<
          string,
          ContainerHotItemAvailableDescription
        >();
        for (const inventory of inventories) {
          const normalized = normalizeHotItemDescription(inventory.description);
          const auctionInventory = inventory.auctions_inventory;
          const price =
            auctionInventory && !auctionInventory.deleted_at
              ? auctionInventory.price
              : 0;
          const isPaid =
            auctionInventory?.status === "PAID" && !auctionInventory.deleted_at;
          const assigned = assignedByDescription.get(normalized);
          const current = availableDescriptionMap.get(normalized) ?? {
            description: inventory.description,
            normalized_description: normalized,
            total_items: 0,
            paid_items: 0,
            total_paid_price: 0,
            category_id: assigned?.category_id ?? null,
            category_name: assigned?.category_name ?? null,
          };

          current.total_items += 1;
          if (isPaid) {
            current.paid_items += 1;
            current.total_paid_price += price;
          }
          availableDescriptionMap.set(normalized, current);
        }

        const reportCategories: ContainerHotItemCategoryReport[] =
          categories.map((category) => {
            const normalizedDescriptions = new Set(
              category.descriptions.map(
                (description) => description.normalized_description,
              ),
            );
            const items = inventories.flatMap((inventory) => {
              const normalized = normalizeHotItemDescription(
                inventory.description,
              );
              if (!normalizedDescriptions.has(normalized)) return [];

              return [presentInventoryItem(inventory)];
            });
            const paidItems = items.filter((item) => item.status === "PAID");

            return {
              category_id: category.category_id,
              name: category.name,
              descriptions: category.descriptions.map(
                (description) => description.description,
              ),
              total_items: items.length,
              paid_items: paidItems.length,
              total_paid_price: paidItems.reduce(
                (sum, item) => sum + item.price,
                0,
              ),
              items,
            };
          });

        return {
          container_id,
          categories: reportCategories.sort(
            (a, b) => b.total_paid_price - a.total_paid_price,
          ),
          suggested_categories: buildSuggestedCategories({
            availableDescriptions: Array.from(availableDescriptionMap.values()),
            inventories,
          }),
          available_descriptions: Array.from(
            availableDescriptionMap.values(),
          ).sort((a, b) => b.total_paid_price - a.total_paid_price),
        } satisfies ContainerHotItemReport;
      } catch (error) {
        handleError("Error getting container hot item categories!", error);
      }
    },

    createCategory: async (input) => {
      try {
        const descriptions = dedupeDescriptions(input.descriptions);
        await getContainer(input.container_id);
        await validateCategoryName(input.container_id, input.name);
        await validateDescriptions(input.container_id, descriptions);

        return await prisma.$transaction(async (tx) => {
          const category = await tx.container_item_categories.create({
            data: {
              container_id: input.container_id,
              name: input.name,
            },
          });

          if (descriptions.length) {
            await tx.container_item_category_descriptions.createMany({
              data: descriptions.map((description) => ({
                ...description,
                category_id: category.category_id,
                container_id: input.container_id,
              })),
            });
          }

          return category;
        });
      } catch (error) {
        handleError("Error creating container hot item category!", error);
      }
    },

    updateCategory: async (input) => {
      try {
        const category = await prisma.container_item_categories.findFirst({
          where: buildTenantWhere("container_item_categories", {
            category_id: input.category_id,
            deleted_at: null,
          }),
          select: { category_id: true, container_id: true },
        });

        if (!category) {
          throw new NotFoundError("Category not found!");
        }

        const descriptions = dedupeDescriptions(input.descriptions);
        await validateCategoryName(
          category.container_id,
          input.name,
          category.category_id,
        );
        await validateDescriptions(
          category.container_id,
          descriptions,
          category.category_id,
        );

        return await prisma.$transaction(async (tx) => {
          const updated = await tx.container_item_categories.update({
            where: { category_id: category.category_id },
            data: { name: input.name },
          });

          await tx.container_item_category_descriptions.deleteMany({
            where: { category_id: category.category_id },
          });

          if (descriptions.length) {
            await tx.container_item_category_descriptions.createMany({
              data: descriptions.map((description) => ({
                ...description,
                category_id: category.category_id,
                container_id: category.container_id,
              })),
            });
          }

          return updated;
        });
      } catch (error) {
        handleError("Error updating container hot item category!", error);
      }
    },

    deleteCategory: async (category_id) => {
      try {
        const category = await prisma.container_item_categories.findFirst({
          where: buildTenantWhere("container_item_categories", {
            category_id,
            deleted_at: null,
          }),
        });

        if (!category) {
          throw new NotFoundError("Category not found!");
        }

        return await prisma.$transaction(async (tx) => {
          await tx.container_item_category_descriptions.deleteMany({
            where: { category_id },
          });

          return await tx.container_item_categories.update({
            where: { category_id },
            data: { deleted_at: new Date() },
          });
        });
      } catch (error) {
        handleError("Error deleting container hot item category!", error);
      }
    },
  };
