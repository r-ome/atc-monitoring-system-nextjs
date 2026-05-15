import { RequestContext } from "@/app/lib/prisma/RequestContext";
import {
  DatabaseOperationError,
  InputParseError,
} from "src/entities/errors/common";
import { createEmployeeUseCase } from "src/application/use-cases/employees/create-employee.use-case";
import {
  createEmployeeSchema,
  EmployeeWithBranchRow,
  Employee,
} from "src/entities/models/Employee";
import { formatDate } from "@/app/lib/utils";
import { err, ok } from "src/entities/models/Result";
import { logger } from "@/app/lib/logger";
import { logActivity } from "@/app/lib/log-activity";

export const presentEmployee = (employee: EmployeeWithBranchRow): Employee => {
  const date_format = "MMM dd, yyyy";
  return {
    employee_id: employee.employee_id,
    first_name: employee.first_name,
    middle_name: employee.middle_name,
    last_name: employee.last_name,
    full_name: `${employee.first_name} ${employee.last_name}`,
    position: employee.position,
    employee_type: employee.employee_type,
    status: employee.status,
    contact_number: employee.contact_number,
    remarks: employee.remarks,
    branch: { branch_id: employee.branch.branch_id, name: employee.branch.name },
    birthday: employee.birthday ? formatDate(employee.birthday, "yyyy-MM-dd") : null,
    date_hired: employee.date_hired ? formatDate(employee.date_hired, "yyyy-MM-dd") : null,
    address: employee.address,
    tin: employee.tin,
    sss_number: employee.sss_number,
    philhealth_number: employee.philhealth_number,
    pagibig_number: employee.pagibig_number,
    emergency_contact_name: employee.emergency_contact_name,
    emergency_contact_number: employee.emergency_contact_number,
    salary_type: employee.salary_type,
    worker_type: employee.worker_type,
    declaration_status: employee.declaration_status,
    default_daily_rate: employee.default_daily_rate?.toNumber() ?? null,
    default_monthly_salary: employee.default_monthly_salary?.toNumber() ?? null,
    default_auction_rate: employee.default_auction_rate?.toNumber() ?? null,
    default_container_rate: employee.default_container_rate?.toNumber() ?? null,
    default_ot_hour_rate: employee.default_ot_hour_rate?.toNumber() ?? null,
    default_ot_minute_rate: employee.default_ot_minute_rate?.toNumber() ?? null,
    created_at: formatDate(employee.created_at, date_format),
    updated_at: formatDate(employee.updated_at, date_format),
  };
};

export const CreateEmployeeController = async (
  input: Record<string, unknown>,
) => {
  const ctx = RequestContext.getStore();
  const user_context = {
    username: ctx?.username,
    branch_name: ctx?.branch_name,
  };

  try {
    const { data, error: inputParseError } =
      createEmployeeSchema.safeParse(input);

    if (inputParseError) {
      throw new InputParseError("Invalid Data!", {
        cause: inputParseError.flatten().fieldErrors,
      });
    }

    const employee = await createEmployeeUseCase(data);
    logger("CreateEmployeeController", { data, ...user_context }, "info");
    await logActivity(
      "CREATE",
      "employee",
      employee.employee_id,
      `Created employee ${employee.first_name} ${employee.last_name} (${employee.employee_type})`,
    );
    return ok(presentEmployee(employee));
  } catch (error) {
    if (error instanceof InputParseError) {
      logger("CreateEmployeeController", error, "warn");
      return err({ message: error.message, cause: error.cause });
    }

    logger("CreateEmployeeController", error);
    if (error instanceof DatabaseOperationError) {
      return err({ message: "Server Error", cause: error.message });
    }

    return err({
      message: "An error occurred! Please contact your admin!",
      cause: "Server Error",
    });
  }
};
