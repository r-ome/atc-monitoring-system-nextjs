import { Prisma } from "@prisma/client";
import { z } from "zod";

export type ContainerItemCategoryRow =
  Prisma.container_item_categoriesGetPayload<object>;

export type ContainerItemCategoryWithDescriptionsRow =
  Prisma.container_item_categoriesGetPayload<{
    include: { descriptions: true };
  }>;

export type ContainerItemCategoryDescriptionRow =
  Prisma.container_item_category_descriptionsGetPayload<object>;

export type ContainerHotItemReportItem = {
  inventory_id: string;
  barcode: string;
  control: string;
  description: string;
  status: string | null;
  price: number;
};

export type ContainerHotItemCategoryReport = {
  category_id: string;
  name: string;
  descriptions: string[];
  total_items: number;
  paid_items: number;
  total_paid_price: number;
  items: ContainerHotItemReportItem[];
};

export type ContainerHotItemSuggestedCategory = {
  name: string;
  descriptions: string[];
  total_items: number;
  paid_items: number;
  total_paid_price: number;
  items: ContainerHotItemReportItem[];
};

export type ContainerHotItemAvailableDescription = {
  description: string;
  normalized_description: string;
  total_items: number;
  paid_items: number;
  total_paid_price: number;
  category_id: string | null;
  category_name: string | null;
};

export type ContainerHotItemReport = {
  container_id: string;
  categories: ContainerHotItemCategoryReport[];
  suggested_categories: ContainerHotItemSuggestedCategory[];
  available_descriptions: ContainerHotItemAvailableDescription[];
};

export function normalizeHotItemDescription(description: string): string {
  return description.trim().replace(/\s+/g, " ").toUpperCase();
}

const hotItemDescriptionSchema = z
  .string()
  .trim()
  .min(1)
  .max(255)
  .transform((value) => value.replace(/\s+/g, " "));

const hotItemCategoryNameSchema = z
  .string()
  .trim()
  .min(1)
  .max(100)
  .transform((value) => value.replace(/\s+/g, " "));

export const getContainerHotItemsSchema = z.object({
  container_id: z.string().min(1),
});

export type GetContainerHotItemsInput = z.infer<
  typeof getContainerHotItemsSchema
>;

export const createContainerHotItemCategorySchema = z.object({
  container_id: z.string().min(1),
  name: hotItemCategoryNameSchema,
  descriptions: z.array(hotItemDescriptionSchema).default([]),
});

export type CreateContainerHotItemCategoryInput = z.infer<
  typeof createContainerHotItemCategorySchema
>;

export const updateContainerHotItemCategorySchema = z.object({
  category_id: z.string().min(1),
  name: hotItemCategoryNameSchema,
  descriptions: z.array(hotItemDescriptionSchema),
});

export type UpdateContainerHotItemCategoryInput = z.infer<
  typeof updateContainerHotItemCategorySchema
>;

export const deleteContainerHotItemCategorySchema = z.object({
  category_id: z.string().min(1),
});

export type DeleteContainerHotItemCategoryInput = z.infer<
  typeof deleteContainerHotItemCategorySchema
>;
