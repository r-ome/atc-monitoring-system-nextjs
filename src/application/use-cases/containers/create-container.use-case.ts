import { ContainerInsertSchema } from "src/entities/models/Container";
import { ContainerRepository } from "src/infrastructure/repositories/containers.repository";
import { getSupplierContainersUseCase } from "../suppliers/get-supplier-containers.use-case";
import { InputParseError } from "src/entities/errors/common";
import { formatNumberPadding } from "@/app/lib/utils";

export const createContainerUseCase = async (
  container: ContainerInsertSchema
) => {
  // validate if container number is already in supplier
  const supplier = await getSupplierContainersUseCase(container.supplier_id);
  const container_barcodes = supplier.containers.map((item) => item.barcode);
  const formatted_barcode = formatNumberPadding(container.barcode, 2);
  container.barcode = `${supplier.supplier_code}-${formatted_barcode}`;

  if (container_barcodes.includes(container.barcode)) {
    throw new InputParseError("Invalid Data!", {
      cause: {
        barcode: [
          `Barcode ${container.barcode} already exist within the Supplier`,
        ],
      },
    });
  }

  return await ContainerRepository.createContainer(container);
};
