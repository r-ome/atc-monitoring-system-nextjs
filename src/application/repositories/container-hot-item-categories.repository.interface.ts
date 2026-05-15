import {
  ContainerHotItemReport,
  ContainerItemCategoryRow,
  CreateContainerHotItemCategoryInput,
  UpdateContainerHotItemCategoryInput,
} from "src/entities/models/ContainerHotItemCategory";

export interface IContainerHotItemCategoryRepository {
  getReportByContainerId: (
    container_id: string,
  ) => Promise<ContainerHotItemReport>;
  createCategory: (
    input: CreateContainerHotItemCategoryInput,
  ) => Promise<ContainerItemCategoryRow>;
  updateCategory: (
    input: UpdateContainerHotItemCategoryInput,
  ) => Promise<ContainerItemCategoryRow>;
  deleteCategory: (category_id: string) => Promise<ContainerItemCategoryRow>;
}
