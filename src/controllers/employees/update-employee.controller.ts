import {
  DatabaseOperationError,
  InputParseError,
  NotFoundError,
} from "src/entities/errors/common";
import { RequestContext } from "@/app/lib/prisma/RequestContext";
import { updateEmployeeSchema } from "src/entities/models/Employee";
import { err, ok } from "src/entities/models/Result";
import { updateEmployeeUseCase } from "src/application/use-cases/employees/update-employee.use-case";
import { logger } from "@/app/lib/logger";
import { logActivity } from "@/app/lib/log-activity";
import { presentEmployee } from "./create-employee.controller";

export const UpdateEmployeeController = async (
  employee_id: string,
  input: Record<string, unknown>,
) => {
  const ctx = RequestContext.getStore();
  const user_context = {
    username: ctx?.username,
    branch_name: ctx?.branch_name,
  };

  try {
    const { data, error: inputParseError } =
      updateEmployeeSchema.safeParse(input);

    if (inputParseError) {
      throw new InputParseError("Invalid Data!", {
        cause: inputParseError.flatten().fieldErrors,
      });
    }

    const employee = await updateEmployeeUseCase(employee_id, data);
    logger("UpdateEmployeeController", { data, ...user_context }, "info");
    await logActivity(
      "UPDATE",
      "employee",
      employee.employee_id,
      `Updated employee ${employee.first_name} ${employee.last_name}`,
    );
    return ok(presentEmployee(employee));
  } catch (error) {
    if (error instanceof InputParseError) {
      logger("UpdateEmployeeController", error, "warn");
      return err({ message: error.message, cause: error.cause });
    }

    if (error instanceof NotFoundError) {
      logger("UpdateEmployeeController", error, "warn");
      return err({ message: error.message, cause: error.cause });
    }

    logger("UpdateEmployeeController", error);
    if (error instanceof DatabaseOperationError) {
      return err({ message: "Server Error", cause: error.message });
    }

    return err({
      message: "An error occurred! Please contact your admin!",
      cause: "Server Error",
    });
  }
};
