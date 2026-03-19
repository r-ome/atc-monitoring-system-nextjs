import { CreateContainerInput } from "src/entities/models/Container";
import { ContainerRepository } from "src/infrastructure/di/repositories";
import { getSupplierBySupplierIdUseCase } from "../suppliers/get-supplier-by-supplier-id.use-case";
import { InputParseError } from "src/entities/errors/common";
import { formatNumberPadding } from "@/app/lib/utils";
import { addDays } from "date-fns";

export const createContainerUseCase = async (
  container: CreateContainerInput,
) => {
  // validate if container number is already in supplier
  const supplier = await getSupplierBySupplierIdUseCase(container.supplier_id);
  const container_barcodes = supplier.containers.map((item) => item.barcode);
  const formatted_barcode = formatNumberPadding(container.barcode, 2);
  const barcode = `${supplier.supplier_code}-${formatted_barcode}`;

  if (container_barcodes.includes(barcode)) {
    throw new InputParseError("Invalid Data!", {
      cause: {
        barcode: [
          `Barcode ${barcode} already exist within the Supplier`,
        ],
      },
    });
  }

  const due_date = container.arrival_date
    ? addDays(container.arrival_date, 40)
    : container.due_date;

  return await ContainerRepository.createContainer({
    ...container,
    barcode,
    due_date,
  });
};
