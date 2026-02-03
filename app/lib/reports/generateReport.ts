import * as xlsx from "xlsx-js-style";
import {
  generateMonitoringReport,
  generateFinalComputation,
  generateUnsoldReport,
  generateInventoryList,
  generateBoughtItemsReport,
  generateCashFlow,
  generateBillReport,
  generateMonthlyCommission,
  generateUnpaidBidders,
  generateBidderNumber,
} from ".";

export type Monitoring = {
  barcode: string;
  control: string;
  description: string;
  bidder_number: string;
  qty: string;
  price: number;
};

type ReportTypes =
  | "monitoring"
  | "final_computation"
  | "encode"
  | "unsold"
  | "bill"
  | "bought_items"
  | "cash_flow"
  | "monthly_commission"
  | "unpaid_bidders"
  | "bidder_number";

const generateReport = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any,
  reports: ReportTypes[],
  filename: string,
) => {
  const workbook = xlsx.utils.book_new();

  if (reports.includes("monitoring")) {
    if (Array.isArray(data)) {
      data.forEach((item) => {
        xlsx.utils.book_append_sheet(
          workbook,
          generateMonitoringReport(item.monitoring),
          item.filename,
        );
      });
    } else {
      xlsx.utils.book_append_sheet(
        workbook,
        generateMonitoringReport(data.monitoring),
        filename,
      );
    }
  }

  if (reports.includes("final_computation")) {
    xlsx.utils.book_append_sheet(
      workbook,
      generateFinalComputation(data.sheetDetails, workbook),
      "FINAL COMPUTATION",
    );
  }

  if (reports.includes("encode")) {
    xlsx.utils.book_append_sheet(
      workbook,
      generateInventoryList(data.inventories),
      "ENCODE",
    );
  }

  if (reports.includes("unsold")) {
    xlsx.utils.book_append_sheet(
      workbook,
      generateUnsoldReport(data.monitoring, data.sheetDetails),
      "UNSOLD",
    );
  }

  if (reports.includes("bill")) {
    xlsx.utils.book_append_sheet(
      workbook,
      generateBillReport(data.sheetDetails, workbook),
      "BILL",
    );
  }

  if (reports.includes("bought_items")) {
    const boughtItemsSheets = generateBoughtItemsReport(data.boughtItems);

    boughtItemsSheets.forEach((boughtItemsSheet) => {
      xlsx.utils.book_append_sheet(
        workbook,
        boughtItemsSheet.sheet,
        boughtItemsSheet.filename,
      );
    });
  }

  if (reports.includes("cash_flow")) {
    xlsx.utils.book_append_sheet(
      workbook,
      generateCashFlow(data),
      filename.toUpperCase(),
    );
  }

  if (reports.includes("monthly_commission")) {
    xlsx.utils.book_append_sheet(
      workbook,
      generateMonthlyCommission(data, workbook),
      "FINAL COMPUTATION",
    );
  }

  if (reports.includes("unpaid_bidders")) {
    xlsx.utils.book_append_sheet(
      workbook,
      generateUnpaidBidders(data),
      "FINAL COMPUTATION",
    );
  }

  if (reports.includes("bidder_number")) {
    xlsx.utils.book_append_sheet(
      workbook,
      generateBidderNumber(data),
      "Bidder Number",
    );
  }

  const excelBuffer = xlsx.write(workbook, {
    bookType: "xlsx",
    type: "array",
  });

  const blob = new Blob([excelBuffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheet.sheet",
  });

  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}.xlsx`;
  link.click();
  URL.revokeObjectURL(link.href);
};

export default generateReport;
