import { UpdateEmployeeInput } from "src/entities/models/Employee";
import { EmployeeRepository } from "src/infrastructure/di/repositories";

export const updateEmployeeUseCase = async (
  employee_id: string,
  input: UpdateEmployeeInput,
) => {
  return EmployeeRepository.updateEmployee(employee_id, input);
};
