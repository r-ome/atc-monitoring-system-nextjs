import type {
  CreateEmploymentEventInput,
  EmploymentEventRow,
} from "src/entities/models/EmploymentEvent";

export interface IEmploymentEventRepository {
  getEventsForEmployee(employee_id: string): Promise<EmploymentEventRow[]>;
  createEvent(data: CreateEmploymentEventInput): Promise<EmploymentEventRow>;
  deleteEvent(event_id: string): Promise<void>;
}
