import { ReportsRepository } from "src/infrastructure/repositories/reports.repository";

export const getTotalExpensesUseCase = async (
  branch_id: string,
  date: string,
) => {
  return ReportsRepository.getTotalExpenses(branch_id, date);
};
