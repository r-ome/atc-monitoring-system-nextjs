import * as xlsx from "xlsx-js-style";
import MillenniumBill from "./MillenniumBill";
import ATCBill from "./ATCBill";

type SheetDetails = {
  barcode: string;
  supplier: { name: string; sales_remittance_account: string };
  arrival_date: string;
  bill_of_lading_number: string;
};

const generateBillReport = (
  sheetDetails: SheetDetails,
  workbook: xlsx.WorkBook
) => {
  const remittanceAccount = sheetDetails.supplier.sales_remittance_account
    .toUpperCase()
    .includes("MILLENNIUM")
    ? "MILLENIUM"
    : "ATC";

  if (remittanceAccount === "MILLENIUM") {
    return MillenniumBill(sheetDetails, workbook);
  } else {
    return ATCBill(sheetDetails, workbook);
  }
};

export default generateBillReport;
