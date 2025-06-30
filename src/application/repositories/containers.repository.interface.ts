import {
  ContainerSchema,
  ContainerInsertSchema,
} from "src/entities/models/Container";
import {
  BaseInventorySchema,
  InventoryInsertSchema,
} from "src/entities/models/Inventory";

export interface IContainerRepository {
  getContainerByBarcode: (barcode: string) => Promise<ContainerSchema | null>;
  getContainerById: (container_id: string) => Promise<ContainerSchema | null>;
  getContainers: () => Promise<
    (Omit<ContainerSchema, "inventories"> & {
      inventories: BaseInventorySchema[];
    })[]
  >;
  createContainer: (
    container: ContainerInsertSchema
  ) => Promise<Omit<ContainerSchema, "inventories" | "branch" | "supplier">>;
  getInventoriesByContainerBarcode: (barcode: string) => Promise<
    Omit<ContainerSchema, "branch" | "supplier" | "inventories"> & {
      inventories: BaseInventorySchema[];
    }
  >;
  updateContainer: (
    container_id: string,
    data: ContainerInsertSchema
  ) => Promise<Omit<ContainerSchema, "inventories">>;
  uploadInventoryFile: (
    rows: InventoryInsertSchema[]
  ) => Promise<{ count: number }>;
}
