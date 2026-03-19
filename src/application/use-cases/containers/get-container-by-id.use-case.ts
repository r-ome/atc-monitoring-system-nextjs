import { NotFoundError } from "src/entities/errors/common";
import { ContainerRepository } from "src/infrastructure/di/repositories";

export const getContainerByIdUseCase = async (container_id: string) => {
  const container = await ContainerRepository.getContainerById(container_id);
  if (!container) {
    throw new NotFoundError("Container not found!");
  }
  return container;
};
