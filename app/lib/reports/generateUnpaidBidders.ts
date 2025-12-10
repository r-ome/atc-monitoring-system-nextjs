import * as xlsx from "xlsx-js-style";
import { formatDate } from "../utils";

const generateUnpaidBidders = (data: {
  branch: string;
  bidders: {
    bidder_number: string;
    balance: number;
    items: string;
    auction_date: string;
  }[];
}) => {
  const headers = [
    "BIDDER NUMBER",
    "NO OF ITEMS",
    "REMARKS",
    "REMAINING BALANCE",
  ];

  const grouped = data.bidders.reduce<Record<string, object[]>>((acc, item) => {
    const date = item.auction_date;
    if (!acc[date]) acc[date] = [];
    acc[date].push(item);
    return acc;
  }, {});

  const sortedGrouped: {
    auction_date: string;
    bidders: {
      bidder_number: string;
      balance: number;
      items: string;
    }[];
  }[] = Object.entries(grouped)
    .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
    .map(([auction_date, bidders]) => ({
      auction_date,
      bidders: bidders as {
        bidder_number: string;
        balance: number;
        items: string;
      }[],
    }));

  const result = sortedGrouped
    .flatMap((group) => {
      const header = {
        bidder_number: "",
        no_of_items: "",
        remarks: group.auction_date.toUpperCase(),
        remaining_balance: "",
      };

      const rows = group.bidders.map((bidder) => ({
        bidder_number: bidder.bidder_number,
        no_of_items: bidder.items.toString(),
        remarks: "",
        remaining_balance: bidder.balance,
      }));

      return [header, ...rows];
    })
    .map((item) => [
      item.bidder_number,
      item.no_of_items,
      item.remarks,
      item.remaining_balance,
    ]);

  const sheet = xlsx.utils.aoa_to_sheet([
    ...Array.from({ length: 2 }, () => [...Array(5).fill(null)]),
    headers,
    ...result,
    ...Array.from({ length: 1 }, () => [...Array(5).fill(null)]),
  ]);

  const lastRowIndex = result.length + 3;

  sheet["!merges"] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 3 } }, // A1:D1
    { s: { r: 1, c: 0 }, e: { r: 1, c: 3 } }, // A2:D2
    { s: { r: lastRowIndex, c: 0 }, e: { r: lastRowIndex, c: 2 } },
  ];
  sheet["!rows"] = [
    { hpt: 30 },
    { hpt: 30 },
    { hpt: 30 },
    ...result.map(() => ({ hpt: 25 })),
  ];
  sheet["!cols"] = [{ wch: 15 }, { wch: 10 }, { wch: 35 }, { wch: 20 }];
  headers.forEach((_, colIndex) => {
    const headerCell = xlsx.utils.encode_cell({ r: 2, c: colIndex });
    if (!sheet[headerCell]) return;

    sheet[headerCell].s = {
      font: { name: "Arial", sz: 12, bold: true, color: { rgb: "FFFFFF" } },
      fill: { fgColor: { rgb: "02B04F" } },
      alignment: {
        horizontal: "center",
        vertical: "center",
        wrapText: true,
      },
      border: {
        top: { style: "thin", color: { rgb: "000000" } },
        right: { style: "thin", color: { rgb: "000000" } },
        bottom: { style: "thin", color: { rgb: "000000" } },
        left: { style: "thin", color: { rgb: "000000" } },
      },
    };
  });

  result.forEach((item, rowIndex) => {
    let style = {
      font: {
        name: "Arial",
        sz: 12,
        bold: true,
        color: {
          rgb: item[0] === "" ? "FFFFFF" : "000000",
        },
      },
      fill: { fgColor: { rgb: item[0] === "" ? "5483C0" : "FFFFFF" } },
      alignment: {
        horizontal: "center",
        vertical: "center",
        wrapText: true,
      },
      border: {
        right: { style: "thin", color: { rgb: "000000" } },
        bottom: { style: "thin", color: { rgb: "000000" } },
        top: { style: "thin", color: { rgb: "000000" } },
        left: { style: "thin", color: { rgb: "000000" } },
      },
    };

    headers.forEach((_, colIndex) => {
      const cellAddress = xlsx.utils.encode_cell({
        r: rowIndex + 3,
        c: colIndex,
      });

      if (sheet[cellAddress]) {
        if (cellAddress.includes("D")) {
          sheet[cellAddress].z = "#,##0.00";
          style = {
            ...style,
            alignment: { ...style.alignment, horizontal: "right" },
          };
        }
        sheet[cellAddress].s = style;
      }
    });
  });

  sheet["A1"] = {
    v: `${data.branch} BRANCH UNPAID`,
    t: "s",
    s: {
      font: { name: "Arial", sz: 20, bold: true },
      fill: { fgColor: { rgb: "A0A0A0" } },
      alignment: {
        horizontal: "center",
        vertical: "center",
        wrapText: true,
      },
    },
  };

  sheet["A2"] = {
    v: `LATEST UPDATE: ${formatDate(new Date(), "EEEE, MMMM dd, yyyy")}`,
    t: "s",
    s: {
      font: { name: "Arial", sz: 11, bold: true },
      fill: { fgColor: { rgb: "A0A0A0" } },
      alignment: {
        horizontal: "center",
        vertical: "center",
        wrapText: true,
      },
    },
  };

  const formulaCell = `D${lastRowIndex + 1}`;

  sheet[`A${lastRowIndex + 1}`] = {
    v: "OVERALL TOTAL",
    t: "s",
    s: {
      font: { name: "Arial", sz: 18, bold: true, color: { rgb: "FF0000" } },
      fill: { fgColor: { rgb: "FFF000" } },
      alignment: { horizontal: "right", vertical: "center" },
    },
  };

  sheet[formulaCell] = {
    t: "n",
    f: `SUM(D5:D${lastRowIndex})`,
    z: "#,##0.00",
    s: {
      font: { name: "Arial", sz: 18, bold: true },
      fill: { fgColor: { rgb: "FFF000" } },
      alignment: { horizontal: "right", vertical: "center" },
    },
  };

  return sheet;
};

export default generateUnpaidBidders;
