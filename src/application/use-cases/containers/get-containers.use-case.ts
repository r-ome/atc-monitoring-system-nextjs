import { ContainerRepository } from "src/infrastructure/repositories/containers.repository";

export const getContainersUseCase = async () => {
  return await ContainerRepository.getContainers();
};
