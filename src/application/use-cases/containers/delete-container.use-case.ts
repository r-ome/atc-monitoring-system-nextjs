import { ContainerRepository } from "src/infrastructure/repositories/containers.repository";

export const deleteContainerUseCase = (container_id: string) => {
  return ContainerRepository.deleteContainer(container_id);
};
