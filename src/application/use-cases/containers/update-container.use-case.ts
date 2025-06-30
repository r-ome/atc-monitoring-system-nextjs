import { InputParseError } from "src/entities/errors/common";
import { ContainerInsertSchema } from "src/entities/models/Container";
import { ContainerRepository } from "src/infrastructure/repositories/containers.repository";
import { getContainerByIdUseCase } from "./get-container-by-id.use-case";
import { getContainerByBarcodeUseCase } from "./get-container-by-barcode.use-case";
import { addDays } from "date-fns";

export const updateContainerUseCase = async (
  container_id: string,
  input: ContainerInsertSchema
) => {
  await getContainerByIdUseCase(container_id);

  const container = await getContainerByBarcodeUseCase(input.barcode);
  if (container.container_id !== container_id && container) {
    throw new InputParseError("Invalid Data!", {
      cause: "Barcode already exist!",
    });
  }

  if (input.arrival_date) {
    input.due_date = addDays(input.arrival_date, 40);
  }

  return await ContainerRepository.updateContainer(container_id, input);
};
