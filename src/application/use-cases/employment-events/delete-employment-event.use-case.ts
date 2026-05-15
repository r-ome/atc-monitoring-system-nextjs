import { EmploymentEventRepository } from "src/infrastructure/di/repositories";

export const deleteEmploymentEventUseCase = (event_id: string) =>
  EmploymentEventRepository.deleteEvent(event_id);
