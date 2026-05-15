import type {
  CreateEmployeeInput,
  EmployeeWithBranchRow,
  UpdateEmployeeInput,
} from "src/entities/models/Employee";

export interface IEmployeeRepository {
  getEmployee(employee_id: string): Promise<EmployeeWithBranchRow>;
  getEmployees(
    branch_id?: string,
  ): Promise<EmployeeWithBranchRow[]>;
  createEmployee(
    data: CreateEmployeeInput,
  ): Promise<EmployeeWithBranchRow>;
  updateEmployee(
    employee_id: string,
    data: UpdateEmployeeInput,
  ): Promise<EmployeeWithBranchRow>;
  deleteEmployee(employee_id: string): Promise<void>;
}
