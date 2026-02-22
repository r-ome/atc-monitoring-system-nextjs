import {
  ContainerRow,
  ContainerWithAllRow,
  ContainerWithDetailsRow,
  ContainerWithInventoriesRow,
  ContainerWithSupplierRow,
  CreateContainerInput,
} from "src/entities/models/Container";
import { CreateInventoryInput } from "src/entities/models/Inventory";

export interface IContainerRepository {
  getContainerByBarcode: (
    barcode: string,
  ) => Promise<ContainerWithDetailsRow | null>;
  getContainerById: (
    container_id: string,
  ) => Promise<ContainerWithDetailsRow | null>;
  getContainers: () => Promise<ContainerWithAllRow[]>;
  createContainer: (container: CreateContainerInput) => Promise<ContainerRow>;
  getInventoriesByContainerBarcode: (barcode: string) => Promise<ContainerWithInventoriesRow>;
  updateContainer: (
    container_id: string,
    data: CreateContainerInput,
  ) => Promise<ContainerWithSupplierRow>;
  uploadInventoryFile: (
    rows: CreateInventoryInput[],
  ) => Promise<{ count: number }>;
  deleteContainer: (container_id: string) => Promise<ContainerRow>;
}
