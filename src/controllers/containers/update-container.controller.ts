import { logger } from "@/app/lib/logger";
import { logActivity } from "@/app/lib/log-activity";
import { formatDate } from "@/app/lib/utils";
import { getContainerByIdUseCase } from "src/application/use-cases/containers/get-container-by-id.use-case";
import { updateContainerUseCase } from "src/application/use-cases/containers/update-container.use-case";
import {
  DatabaseOperationError,
  InputParseError,
  NotFoundError,
} from "src/entities/errors/common";
import {
  ContainerWithDetailsRow,
  ContainerWithSupplierAndBranchRow,
  updateContainerSchema,
} from "src/entities/models/Container";
import { err, ok } from "src/entities/models/Result";
import { presentContainer } from "./create-container.controller";

const DATE_FORMAT = "MMM dd, yyyy";

type ContainerActivitySnapshot =
  | ContainerWithDetailsRow
  | ContainerWithSupplierAndBranchRow;

const CONTAINER_ACTIVITY_FIELDS = [
  {
    label: "Supplier",
    getValue: (container: ContainerActivitySnapshot) =>
      container.supplier?.name && container.supplier?.supplier_code
        ? `${container.supplier.name} (${container.supplier.supplier_code})`
        : "N/A",
  },
  {
    label: "Branch",
    getValue: (container: ContainerActivitySnapshot) =>
      container.branch?.name || "N/A",
  },
  {
    label: "Barcode",
    getValue: (container: ContainerActivitySnapshot) =>
      formatActivityText(container.barcode),
  },
  {
    label: "Bill of Lading Number",
    getValue: (container: ContainerActivitySnapshot) =>
      formatActivityText(container.bill_of_lading_number),
  },
  {
    label: "Container Number",
    getValue: (container: ContainerActivitySnapshot) =>
      formatActivityText(container.container_number),
  },
  {
    label: "Auction Or Sell",
    getValue: (container: ContainerActivitySnapshot) =>
      formatActivityText(container.auction_or_sell),
  },
  {
    label: "Gross Weight",
    getValue: (container: ContainerActivitySnapshot) =>
      formatActivityText(container.gross_weight),
  },
  {
    label: "Duties and Taxes",
    getValue: (container: ContainerActivitySnapshot) =>
      Number(container.duties_and_taxes ?? 0).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
  },
  {
    label: "Arrival Date",
    getValue: (container: ContainerActivitySnapshot) =>
      formatActivityDate(container.arrival_date),
  },
  {
    label: "Due Date",
    getValue: (container: ContainerActivitySnapshot) =>
      formatActivityDate(container.due_date),
  },
] as const;

function formatActivityText(value?: string | null) {
  return value && value.trim() ? value : "N/A";
}

function formatActivityDate(value?: Date | null) {
  return value ? formatDate(value, DATE_FORMAT) : "N/A";
}

function buildContainerUpdateDescription(
  previous: ContainerWithDetailsRow,
  updated: ContainerWithSupplierAndBranchRow,
) {
  const changes = CONTAINER_ACTIVITY_FIELDS.flatMap(({ label, getValue }) => {
    const previousValue = getValue(previous);
    const updatedValue = getValue(updated);

    if (previousValue === updatedValue) {
      return [];
    }

    return [`${label}: ${previousValue} -> ${updatedValue}`];
  });

  if (!changes.length) {
    return `Updated container ${updated.barcode} with no field changes`;
  }

  return `Updated container ${updated.barcode} | ${changes.join(" | ")}`;
}

export const UpdateContainerController = async (
  container_id: string,
  input: Record<string, unknown>,
) => {
  try {
    const parsed = {
      ...input,
      arrival_date: input.arrival_date ? new Date(input.arrival_date as string) : null,
      due_date: input.due_date ? new Date(input.due_date as string) : null,
    };

    const { data, error: inputParseError } =
      updateContainerSchema.safeParse(parsed);

    if (inputParseError) {
      throw new InputParseError("Invalid Data!", {
        cause: inputParseError.flatten().fieldErrors,
      });
    }

    const previous = await getContainerByIdUseCase(container_id);
    const container = await updateContainerUseCase(container_id, data);
    await logActivity(
      "UPDATE",
      "container",
      container_id,
      buildContainerUpdateDescription(previous, container),
    );
    return ok(presentContainer(container));
  } catch (error) {
    if (error instanceof InputParseError) {
      logger("UpdateContainerController", error, "warn");
      return err({ message: error.message, cause: error.cause });
    }

    if (error instanceof NotFoundError) {
      logger("UpdateContainerController", error, "warn");
      return err({ message: error.message, cause: error.cause });
    }

    logger("UpdateContainerController", error);
    if (error instanceof DatabaseOperationError) {
      return err({ message: "Server Error", cause: error.message });
    }

    return err({
      message: "An error occurred! Please contact your admin!",
      cause: "Server Error",
    });
  }
};
