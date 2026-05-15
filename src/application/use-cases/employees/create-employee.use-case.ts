import { CreateEmployeeInput } from "src/entities/models/Employee";
import { EmployeeRepository } from "src/infrastructure/di/repositories";

export const createEmployeeUseCase = async (input: CreateEmployeeInput) => {
  return EmployeeRepository.createEmployee(input);
};
