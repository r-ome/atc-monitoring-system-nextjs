import { IEmployeeRepository } from "src/application/repositories/employees.repository.interface";
import prisma from "@/app/lib/prisma/prisma";
import {
  NotFoundError,
  DatabaseOperationError,
} from "src/entities/errors/common";
import {
  isPrismaError,
  isPrismaValidationError,
} from "@/app/lib/error-handler";

export const EmployeeRepository: IEmployeeRepository = {
  getEmployee: async (employee_id) => {
    try {
      const employee = await prisma.employees.findFirst({
        where: { employee_id, deleted_at: null },
        include: { branch: true },
      });

      if (!employee) {
        throw new NotFoundError("Employee not found!");
      }

      return employee;
    } catch (error) {
      if (isPrismaError(error) || isPrismaValidationError(error)) {
        throw new DatabaseOperationError("Error getting employee!", {
          cause: error.message,
        });
      }
      throw error;
    }
  },

  getEmployees: async (branch_id) => {
    try {
      return await prisma.employees.findMany({
        where: {
          deleted_at: null,
          ...(branch_id ? { branch_id } : {}),
        },
        include: { branch: true },
        orderBy: [{ status: "asc" }, { last_name: "asc" }, { first_name: "asc" }],
      });
    } catch (error) {
      if (isPrismaError(error) || isPrismaValidationError(error)) {
        throw new DatabaseOperationError("Error getting employees!", {
          cause: error.message,
        });
      }
      throw error;
    }
  },

  createEmployee: async (data) => {
    try {
      return await prisma.employees.create({
        include: { branch: true },
        data: {
          first_name: data.first_name,
          middle_name: data.middle_name ?? null,
          last_name: data.last_name,
          position: data.position ?? null,
          employee_type: data.employee_type,
          status: data.status,
          contact_number: data.contact_number ?? null,
          remarks: data.remarks ?? null,
          branch_id: data.branch_id,
          birthday: data.birthday ? new Date(data.birthday) : null,
          date_hired: data.date_hired ? new Date(data.date_hired) : null,
          address: data.address ?? null,
          tin: data.tin ?? null,
          sss_number: data.sss_number ?? null,
          philhealth_number: data.philhealth_number ?? null,
          pagibig_number: data.pagibig_number ?? null,
          emergency_contact_name: data.emergency_contact_name ?? null,
          emergency_contact_number: data.emergency_contact_number ?? null,
          salary_type: data.salary_type,
          worker_type: data.worker_type,
          declaration_status: data.declaration_status ?? "DECLARED",
          default_daily_rate: data.default_daily_rate ?? null,
          default_monthly_salary: data.default_monthly_salary ?? null,
          default_auction_rate: data.default_auction_rate ?? null,
          default_container_rate: data.default_container_rate ?? null,
          default_ot_hour_rate: data.default_ot_hour_rate ?? null,
          default_ot_minute_rate: data.default_ot_minute_rate ?? null,
        },
      });
    } catch (error) {
      if (isPrismaError(error) || isPrismaValidationError(error)) {
        throw new DatabaseOperationError("Error creating employee!", {
          cause: error.message,
        });
      }
      throw error;
    }
  },

  updateEmployee: async (employee_id, data) => {
    try {
      return await prisma.employees.update({
        include: { branch: true },
        where: { employee_id },
        data: {
          first_name: data.first_name,
          middle_name: data.middle_name ?? null,
          last_name: data.last_name,
          position: data.position ?? null,
          employee_type: data.employee_type,
          status: data.status,
          contact_number: data.contact_number ?? null,
          remarks: data.remarks ?? null,
          branch_id: data.branch_id,
          birthday: data.birthday ? new Date(data.birthday) : null,
          date_hired: data.date_hired ? new Date(data.date_hired) : null,
          address: data.address ?? null,
          tin: data.tin ?? null,
          sss_number: data.sss_number ?? null,
          philhealth_number: data.philhealth_number ?? null,
          pagibig_number: data.pagibig_number ?? null,
          emergency_contact_name: data.emergency_contact_name ?? null,
          emergency_contact_number: data.emergency_contact_number ?? null,
          salary_type: data.salary_type,
          worker_type: data.worker_type,
          declaration_status: data.declaration_status ?? "DECLARED",
          default_daily_rate: data.default_daily_rate ?? null,
          default_monthly_salary: data.default_monthly_salary ?? null,
          default_auction_rate: data.default_auction_rate ?? null,
          default_container_rate: data.default_container_rate ?? null,
          default_ot_hour_rate: data.default_ot_hour_rate ?? null,
          default_ot_minute_rate: data.default_ot_minute_rate ?? null,
        },
      });
    } catch (error) {
      if (isPrismaError(error) || isPrismaValidationError(error)) {
        throw new DatabaseOperationError("Error updating employee!", {
          cause: error.message,
        });
      }
      throw error;
    }
  },

  deleteEmployee: async (employee_id) => {
    try {
      const employee = await prisma.employees.findFirst({ where: { employee_id, deleted_at: null } });
      if (!employee) throw new NotFoundError("Employee not found!");
      await prisma.employees.update({
        where: { employee_id },
        data: { deleted_at: new Date() },
      });
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      if (isPrismaError(error) || isPrismaValidationError(error)) {
        throw new DatabaseOperationError("Error deleting employee!", { cause: error.message });
      }
      throw error;
    }
  },
};
