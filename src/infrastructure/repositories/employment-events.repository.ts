import { IEmploymentEventRepository } from "src/application/repositories/employment-events.repository.interface";
import prisma from "@/app/lib/prisma/prisma";
import { NotFoundError, DatabaseOperationError } from "src/entities/errors/common";
import { isPrismaError, isPrismaValidationError } from "@/app/lib/error-handler";
import type { CreateEmploymentEventInput } from "src/entities/models/EmploymentEvent";

export const EmploymentEventRepository: IEmploymentEventRepository = {
  getEventsForEmployee: async (employee_id) => {
    try {
      return await prisma.employee_employment_events.findMany({
        where: { employee_id, deleted_at: null },
        orderBy: { effective_date: "desc" },
      });
    } catch (error) {
      if (isPrismaError(error) || isPrismaValidationError(error)) {
        throw new DatabaseOperationError("Error getting employment events!", { cause: error.message });
      }
      throw error;
    }
  },

  createEvent: async (data: CreateEmploymentEventInput) => {
    try {
      return await prisma.employee_employment_events.create({
        data: {
          employee_id: data.employee_id,
          event_type: data.event_type,
          effective_date: new Date(data.effective_date),
          remarks: data.remarks ?? null,
        },
      });
    } catch (error) {
      if (isPrismaError(error) || isPrismaValidationError(error)) {
        throw new DatabaseOperationError("Error creating employment event!", { cause: error.message });
      }
      throw error;
    }
  },

  deleteEvent: async (event_id) => {
    try {
      const event = await prisma.employee_employment_events.findFirst({
        where: { event_id, deleted_at: null },
      });
      if (!event) throw new NotFoundError("Employment event not found!");
      await prisma.employee_employment_events.update({
        where: { event_id },
        data: { deleted_at: new Date() },
      });
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      if (isPrismaError(error) || isPrismaValidationError(error)) {
        throw new DatabaseOperationError("Error deleting employment event!", { cause: error.message });
      }
      throw error;
    }
  },
};
