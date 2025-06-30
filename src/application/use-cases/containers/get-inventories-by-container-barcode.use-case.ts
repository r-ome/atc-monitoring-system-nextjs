import { ContainerRepository } from "src/infrastructure/repositories/containers.repository";

export const getInventoriesByContainerBarcodeUseCase = async (
  barcode: string
) => {
  return await ContainerRepository.getInventoriesByContainerBarcode(barcode);
};
