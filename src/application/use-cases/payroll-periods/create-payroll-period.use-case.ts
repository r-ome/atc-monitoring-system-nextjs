import { PayrollPeriodRepository } from "src/infrastructure/di/repositories";
import type { CreatePayrollPeriodInput } from "src/entities/models/PayrollPeriod";

export const createPayrollPeriodUseCase = (input: CreatePayrollPeriodInput) =>
  PayrollPeriodRepository.createPeriod(input);
