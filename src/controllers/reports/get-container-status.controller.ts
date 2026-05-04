import { ok, err } from "src/entities/models/Result";
import { DatabaseOperationError } from "src/entities/errors/common";
import { logger } from "@/app/lib/logger";
import { ReportsRepository } from "src/infrastructure/di/repositories";
import { ContainerStatusRow, ContainerStatusEntry } from "src/entities/models/Report";
import { formatDate } from "@/app/lib/utils";

function presenter(rows: ContainerStatusRow[]): ContainerStatusEntry[] {
  const today = new Date();

  return rows.map((container) => {
    const days_since_arrival = container.arrival_date
      ? Math.floor(
          (today.getTime() - container.arrival_date.getTime()) /
            (1000 * 60 * 60 * 24),
        )
      : null;

    return {
      barcode: container.barcode,
      container_number: container.container_number,
      supplier_name: container.supplier_name,
      status: container.status,
      arrival_date: container.arrival_date
        ? formatDate(container.arrival_date, "MMM dd, yyyy")
        : null,
      due_date: container.due_date
        ? formatDate(container.due_date, "MMM dd, yyyy")
        : null,
      days_since_arrival,
      duties_and_taxes: Number(container.duties_and_taxes),
      total_items: container.total_items,
      paid_items: container.paid_items,
    };
  });
}

export function presentContainerStatus(rows: ContainerStatusRow[]): ContainerStatusEntry[] {
  return presenter(rows);
}

export const GetContainerStatusController = async (branch_id: string) => {
  try {
    const rows = await ReportsRepository.getContainerStatusOverview(branch_id);
    return ok(presenter(rows));
  } catch (error) {
    logger("GetContainerStatusController", error);
    if (error instanceof DatabaseOperationError) {
      return err({ message: "Server Error", cause: error.message });
    }
    return err({ message: "An error occurred! Please contact your admin!", cause: "Server Error" });
  }
};
