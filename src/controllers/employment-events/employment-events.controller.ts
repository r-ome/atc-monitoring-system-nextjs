import { RequestContext } from "@/app/lib/prisma/RequestContext";
import { DatabaseOperationError, InputParseError, NotFoundError } from "src/entities/errors/common";
import { ok, err } from "src/entities/models/Result";
import { logger } from "@/app/lib/logger";
import { logActivity } from "@/app/lib/log-activity";
import { formatDate } from "@/app/lib/utils";
import { createEmploymentEventSchema } from "src/entities/models/EmploymentEvent";
import { EmploymentEventRepository } from "src/infrastructure/di/repositories";
import { addEmploymentEventUseCase } from "src/application/use-cases/employment-events/add-employment-event.use-case";
import { deleteEmploymentEventUseCase } from "src/application/use-cases/employment-events/delete-employment-event.use-case";

export const GetEmploymentEventsController = async (employee_id: string) => {
  try {
    const events = await EmploymentEventRepository.getEventsForEmployee(employee_id);
    return ok(
      events.map((e) => ({
        event_id: e.event_id,
        employee_id: e.employee_id,
        event_type: e.event_type,
        effective_date: formatDate(e.effective_date, "MMM dd, yyyy"),
        remarks: e.remarks,
        created_at: formatDate(e.created_at, "MMM dd, yyyy"),
      })),
    );
  } catch (error) {
    logger("GetEmploymentEventsController", error);
    return err({ message: "Server Error", cause: "Failed to get employment events" });
  }
};

export const AddEmploymentEventController = async (input: Record<string, unknown>) => {
  const ctx = RequestContext.getStore();
  try {
    const { data, error: inputParseError } = createEmploymentEventSchema.safeParse(input);
    if (inputParseError) {
      throw new InputParseError("Invalid Data!", { cause: inputParseError.flatten().fieldErrors });
    }
    const event = await addEmploymentEventUseCase(data);
    logger("AddEmploymentEventController", { data, username: ctx?.username }, "info");
    await logActivity("CREATE", "employment_event", event.event_id, `Added ${event.event_type} event for employee ${event.employee_id}`);
    return ok({
      event_id: event.event_id,
      employee_id: event.employee_id,
      event_type: event.event_type,
      effective_date: formatDate(event.effective_date, "MMM dd, yyyy"),
      remarks: event.remarks,
      created_at: formatDate(event.created_at, "MMM dd, yyyy"),
    });
  } catch (error) {
    if (error instanceof InputParseError) return err({ message: error.message, cause: error.cause });
    logger("AddEmploymentEventController", error);
    if (error instanceof DatabaseOperationError) return err({ message: "Server Error", cause: error.message });
    return err({ message: "An error occurred! Please contact your admin!", cause: "Server Error" });
  }
};

export const DeleteEmploymentEventController = async (event_id: string) => {
  const ctx = RequestContext.getStore();
  try {
    await deleteEmploymentEventUseCase(event_id);
    logger("DeleteEmploymentEventController", { event_id, username: ctx?.username }, "info");
    await logActivity("DELETE", "employment_event", event_id, `Deleted employment event`);
    return ok({ deleted: true });
  } catch (error) {
    logger("DeleteEmploymentEventController", error);
    if (error instanceof NotFoundError) return err({ message: error.message, cause: error.cause });
    return err({ message: "An error occurred! Please contact your admin!", cause: "Server Error" });
  }
};
