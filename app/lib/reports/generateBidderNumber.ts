import * as xlsx from "xlsx-js-style";
import { getYear } from "date-fns";

type GenerateBidderNumberProps = {
  branch_name: string;
  bidder_number: string;
  full_name: string;
};

const generateBidderNumber = ({
  branch_name,
  bidder_number,
  full_name,
}: GenerateBidderNumberProps) => {
  const sheet = xlsx.utils.aoa_to_sheet([
    ...Array.from({ length: 50 }, () => [""]),
  ]);

  sheet["!cols"] = [{ wch: 140 }];
  sheet["!merges"] = [
    { s: { r: 0, c: 0 }, e: { r: 4, c: 0 } }, // A1:A5
    { s: { r: 6, c: 0 }, e: { r: 8, c: 0 } }, // A7:A9
    { s: { r: 9, c: 0 }, e: { r: 10, c: 0 } }, // A10:A11
    { s: { r: 11, c: 0 }, e: { r: 35, c: 0 } }, // A12:A36
    { s: { r: 36, c: 0 }, e: { r: 38, c: 0 } }, // A37:A39
    { s: { r: 39, c: 0 }, e: { r: 40, c: 0 } }, // A40:A41
  ];

  sheet["A1"] = {
    v: "HELLO WORLD",
    t: "s",
    s: {
      font: { name: "Calibri", sz: 14, bold: true },
      alignment: {
        horizontal: "center",
        vertical: "center",
        wrapText: true,
      },
    },
  };

  sheet["A7"] = {
    v: `NAME: ${full_name}`,
    t: "s",
    s: {
      font: { name: "Calibri", sz: 36, bold: true },
      alignment: {
        horizontal: "left",
        vertical: "center",
        wrapText: true,
      },
      border: {
        top: { style: "thin", color: { rgb: "000000" } },
        bottom: { style: "thin", color: { rgb: "000000" } },
        left: { style: "thin", color: { rgb: "000000" } },
        right: { style: "thin", color: { rgb: "000000" } },
      },
    },
  };

  sheet["A10"] = {
    v: `BIDDER NUMBER`,
    t: "s",
    s: {
      font: { name: "Tahoma", sz: 28, bold: true, color: { rgb: "F00000" } },
      alignment: {
        horizontal: "center",
        vertical: "center",
      },
      border: {
        top: { style: "thin", color: { rgb: "000000" } },
      },
    },
  };

  sheet["A12"] = {
    v: `${bidder_number}`,
    t: "s",
    s: {
      font: { name: "Tahoma", sz: 250, bold: true, color: { rgb: "203764" } },
      alignment: {
        horizontal: "center",
        vertical: "center",
      },
      border: {
        top: { style: "thin", color: { rgb: "000000" } },
      },
    },
  };

  sheet["A37"] = {
    v: `Registered Branch: ${branch_name}`,
    t: "s",
    s: {
      font: { name: "Tahoma", sz: 28, bold: true, color: { rgb: "0070c0" } },
      alignment: {
        horizontal: "center",
        vertical: "center",
      },
      border: {
        top: { style: "thin", color: { rgb: "000000" } },
      },
    },
  };

  sheet["A40"] = {
    v: `© ${getYear(new Date())} ATC JAPAN AUCTION. ALL RIGHTS RESERVED.`,
    t: "s",
    s: {
      font: { name: "Tahoma", sz: 16, bold: true },
      alignment: {
        horizontal: "center",
        vertical: "center",
      },
      border: {
        right: { style: "thin", color: { rgb: "000000" } },
        top: { style: "thin", color: { rgb: "000000" } },
      },
    },
  };

  ["A8", "A9", "A41"].forEach((item) => {
    sheet[item] = {
      v: ``,
      t: "s",
      s: {
        font: { name: "Tahoma", sz: 16, bold: true },
        alignment: {
          horizontal: "center",
          vertical: "center",
        },
        border: {
          bottom: { style: "thin", color: { rgb: "000000" } },
          right: { style: "thin", color: { rgb: "000000" } },
        },
      },
    };
  });

  return sheet;
};

export default generateBidderNumber;
