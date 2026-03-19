import {
  ContainerRow,
  ContainerListRow,
  ContainerWithAllRow,
  ContainerWithDetailsRow,
  ContainerWithInventoriesRow,
  ContainerWithSupplierAndBranchRow,
  CreateContainerInput,
  UpdateContainerInput,
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
  getContainersList: () => Promise<ContainerListRow[]>;
  createContainer: (container: CreateContainerInput) => Promise<ContainerRow>;
  getInventoriesByContainerBarcode: (barcode: string) => Promise<ContainerWithInventoriesRow>;
  updateContainer: (
    container_id: string,
    data: UpdateContainerInput,
  ) => Promise<ContainerWithSupplierAndBranchRow>;
  uploadInventoryFile: (
    rows: CreateInventoryInput[],
  ) => Promise<{ count: number }>;
  deleteContainer: (container_id: string) => Promise<ContainerRow>;
}
