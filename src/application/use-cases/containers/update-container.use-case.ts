import { InputParseError } from "src/entities/errors/common";
import { ContainerInsertSchema } from "src/entities/models/Container";
import { ContainerRepository } from "src/infrastructure/repositories/containers.repository";
import { getContainerByBarcodeUseCase } from "./get-container-by-barcode.use-case";
import { addDays } from "date-fns";
import { logger } from "@/app/lib/logger";

export const updateContainerUseCase = async (
  container_id: string,
  input: ContainerInsertSchema
) => {
  let container;
  try {
    container = await getContainerByBarcodeUseCase(input.barcode);
  } catch (error) {
    logger("updateContainerUseCase", error);
  }

  if (container) {
    if (container.container_id !== container_id && container) {
      throw new InputParseError("Invalid Data!", {
        cause: "Barcode already exist!",
      });
    }
  }
  if (input.arrival_date) {
    input.due_date = addDays(input.arrival_date, 40);
  }

  return await ContainerRepository.updateContainer(container_id, input);
};
