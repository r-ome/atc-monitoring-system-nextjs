import { EmploymentEventRepository } from "src/infrastructure/di/repositories";
import type { CreateEmploymentEventInput } from "src/entities/models/EmploymentEvent";

export const addEmploymentEventUseCase = (input: CreateEmploymentEventInput) =>
  EmploymentEventRepository.createEvent(input);
