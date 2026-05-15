import { NotFoundError, DatabaseOperationError } from "src/entities/errors/common";
import { ok, err } from "src/entities/models/Result";
import { logger } from "@/app/lib/logger";
import { deleteEmployeeUseCase } from "src/application/use-cases/employees/delete-employee.use-case";

export const DeleteEmployeeController = async (employee_id: string) => {
  try {
    await deleteEmployeeUseCase(employee_id);
    return ok(null);
  } catch (error) {
    logger("DeleteEmployeeController", error);
    if (error instanceof NotFoundError) return err({ message: error.message, cause: error.cause });
    if (error instanceof DatabaseOperationError) return err({ message: error.message, cause: error.cause });
    return err({ message: "An error occurred! Please contact your admin.", cause: "Server Error" });
  }
};
