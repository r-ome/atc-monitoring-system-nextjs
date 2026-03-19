import { InputParseError } from "src/entities/errors/common";
import { UpdateContainerInput } from "src/entities/models/Container";
import { ContainerRepository } from "src/infrastructure/di/repositories";
import { getContainerByBarcodeUseCase } from "./get-container-by-barcode.use-case";
import { addDays } from "date-fns";
import { logger } from "@/app/lib/logger";

export const updateContainerUseCase = async (
  container_id: string,
  input: UpdateContainerInput,
) => {
  let container;
  try {
    container = await getContainerByBarcodeUseCase(input.barcode);
  } catch (error) {
    logger("updateContainerUseCase", error);
  }

  if (container && container.container_id !== container_id) {
    throw new InputParseError("Invalid Data!", {
      cause: { barcode: ["Barcode already exist!"] },
    });
  }

  const due_date = input.arrival_date
    ? addDays(input.arrival_date, 40)
    : input.due_date;

  return await ContainerRepository.updateContainer(container_id, {
    ...input,
    due_date,
  });
};
