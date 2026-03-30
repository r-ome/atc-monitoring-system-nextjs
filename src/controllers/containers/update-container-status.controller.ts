import { logger } from "@/app/lib/logger";
import { logActivity } from "@/app/lib/log-activity";
import { ContainerRepository } from "src/infrastructure/di/repositories";
import { DatabaseOperationError } from "src/entities/errors/common";
import { err, ok } from "src/entities/models/Result";

export const UpdateContainerStatusController = async (
  container_id: string,
  status: "PAID" | "UNPAID",
) => {
  try {
    const container = await ContainerRepository.updateContainerStatus(
      container_id,
      status,
    );
    await logActivity(
      "UPDATE",
      "container",
      container_id,
      `Marked container ${container.barcode} as ${status}`,
    );
    return ok(container);
  } catch (error) {
    logger("UpdateContainerStatusController", error);
    if (error instanceof DatabaseOperationError) {
      return err({ message: "Server Error", cause: error.message });
    }

    return err({
      message: "An error occurred! Please contact your admin!",
      cause: "Server Error",
    });
  }
};
