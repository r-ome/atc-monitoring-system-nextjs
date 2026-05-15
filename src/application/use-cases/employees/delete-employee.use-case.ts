import { EmployeeRepository } from "src/infrastructure/di/repositories";

export const deleteEmployeeUseCase = (employee_id: string) =>
  EmployeeRepository.deleteEmployee(employee_id);
