import { EmployeeRepository } from "src/infrastructure/di/repositories";
import { ok, err } from "src/entities/models/Result";
import { DatabaseOperationError } from "src/entities/errors/common";
import { logger } from "@/app/lib/logger";
import { presentEmployee } from "./create-employee.controller";

export const GetEmployeesController = async (branch_id?: string) => {
  try {
    const employees = await EmployeeRepository.getEmployees(branch_id);
    return ok(employees.map(presentEmployee));
  } catch (error) {
    logger("GetEmployeesController", error);
    if (error instanceof DatabaseOperationError) {
      return err({ message: "Server Error", cause: error.message });
    }
    return err({
      message: "An error occurred! Please contact your admin!",
      cause: "Server Error",
    });
  }
};
