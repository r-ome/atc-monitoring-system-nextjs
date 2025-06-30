import * as xlsx from "xlsx-js-style";
import { BoughtItems } from "src/entities/models/Inventory";
import { Monitoring } from "./generateReport";
import generateMonitoringReport from "./generateMonitoringReport";

const generateBoughtItemsReport = (boughtItems: BoughtItems[]) => {
  const headers = [
    "BARCODE",
    "CONTROL",
    "DESCRIPTION",
    "OLD PRICE",
    "NEW PRICE",
  ];

  const data = boughtItems.map((item) => [
    item.barcode,
    item.control,
    item.description,
    item.old_price,
    item.new_price,
  ]);

  const containers = [
    ...new Set(
      boughtItems.map((item) => {
        const splittedBarcode = item.barcode.split("-");
        let barcode = "";
        if (splittedBarcode.length === 3) {
          barcode = item.barcode.split("-").slice(0, 2).join("-");
        }

        return barcode;
      })
    ),
  ];

  const sheet = xlsx.utils.aoa_to_sheet([headers, ...data]);
  sheet["!autofilter"] = { ref: "A1:E1" };
  sheet["!cols"] = [
    { wch: 15 },
    { wch: 15 },
    { wch: 30 },
    { wch: 15 },
    { wch: 15 },
  ];

  headers.forEach((_, colIndex) => {
    const headerCell = xlsx.utils.encode_cell({ r: 0, c: colIndex });
    if (!sheet[headerCell]) return;
    sheet[headerCell].s = {
      font: { name: "Calibri", sz: 11, bold: true, color: { rgb: "FFFFFF" } },
      fill: { fgColor: { rgb: "5B9BD5" } },
      alignment: { horizontal: "center", vertical: "center", wrapText: true },
    };
  });

  data.forEach((_, rowIndex) => {
    const style = {
      font: { name: "Calibri", sz: 11 },
      fill: { fgColor: { rgb: rowIndex % 2 === 0 ? "DDEBF7" : "FFFFFF" } },
      alignment: { horizontal: "center", vertical: "center", wrapText: true },
      border: {
        right: { style: "thin", color: { rgb: "9BC2E6" } },
        bottom: { style: "thin", color: { rgb: "9BC2E6" } },
        top: { style: "thin", color: { rgb: "9BC2E6" } },
      },
    };

    headers.forEach((_, colIndex) => {
      const cellAddress = xlsx.utils.encode_cell({
        r: rowIndex + 1,
        c: colIndex,
      });

      if (sheet[cellAddress]) {
        sheet[cellAddress].s = style;
      }
    });
  });

  const sheets: { filename: string; sheet: xlsx.WorkSheet }[] = [
    { filename: "Bought Items", sheet },
  ];

  if (containers.length > 1) {
    containers.forEach((container) => {
      const monitoring = boughtItems
        .filter((item) => item.barcode.includes(container))
        .map((item) => ({
          barcode: item.barcode,
          control: item.control,
          description: item.description,
          bidder_number: item.bidder_number,
          qty: item.qty,
          price: item.new_price,
        })) as Monitoring[];

      sheets.push({
        filename: container,
        sheet: generateMonitoringReport(monitoring),
      });
    });
  }

  return sheets;
};

export default generateBoughtItemsReport;
