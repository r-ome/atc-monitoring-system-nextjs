import * as xlsx from "xlsx-js-style";
import MillenniumBill from "./MillenniumBill";
import ATCBill from "./ATCBill";

const generateBillReport = (sheetDetails: any, workbook: xlsx.WorkBook) => {
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
