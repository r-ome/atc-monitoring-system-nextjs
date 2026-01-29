import { ReportsRepository } from "src/infrastructure/repositories/reports.repository";

export const getTotalSalesUseCase = async (branch_id: string, date: string) => {
  return ReportsRepository.getTotalSales(branch_id, date);
};
