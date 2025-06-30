import { NotFoundError } from "src/entities/errors/common";
import { ContainerRepository } from "src/infrastructure/repositories/containers.repository";

export const getContainerByBarcodeUseCase = async (barcode: string) => {
  const container = await ContainerRepository.getContainerByBarcode(barcode);
  if (!container) {
    throw new NotFoundError(`Container ${barcode} not found!`);
  }
  return container;
};
