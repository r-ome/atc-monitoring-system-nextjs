"use client";

import {
  Table,
  TableBody,
  TableRow,
  TableFooter,
  TableCell,
} from "@/app/components/ui/table";
import { useBidderPullOutModalContext } from "../../context/BidderPullOutModalContext";

export const PaymentBreakdownDetails: React.FC = () => {
  const {
    selectedItems,
    totalItemPrice,
    grandTotal,
    serviceChargeAmount,
    registeredBidder,
  } = useBidderPullOutModalContext();

  const paymentDetails = [
    {
      label: "Total Number of Items",
      value: `${selectedItems.length} Items`,
    },
    {
      label: "Service Charge(%)",
      value: `${registeredBidder?.service_charge}%`,
    },
    {
      label: "Total Item Price",
      value: totalItemPrice.toLocaleString(),
    },
    {
      label: "Service Charge Amount",
      value: serviceChargeAmount.toLocaleString(),
    },
    {
      label: "TOTAL",
      value: (totalItemPrice + serviceChargeAmount).toLocaleString(),
    },
  ];

  return (
    <div className="w-2/3 mx-auto space-y-4">
      <Table className="border">
        <TableBody>
          {paymentDetails.map((item) => (
            <TableRow
              key={item.label}
              className="[&>td]:border-r last:border-r-0"
            >
              <TableCell className="text-right text-lg">{item.label}</TableCell>
              <TableCell className="text-right text-lg">{item.value}</TableCell>
            </TableRow>
          ))}

          {!registeredBidder?.already_consumed && (
            <TableRow className="[&>td]:border-r last:border-r-0 bg-red-400 hover:bg-red-400">
              <TableCell className="text-right text-lg">
                Registration Fee
              </TableCell>
              <TableCell className="text-lg text-right">
                -{registeredBidder?.registration_fee.toLocaleString()}
              </TableCell>
            </TableRow>
          )}
        </TableBody>

        <TableFooter>
          <TableRow className="[&>td]:border-r last:border-r-0">
            <TableCell className="text-right text-lg">GRAND TOTAL</TableCell>
            <TableCell className="text-lg font-bold text-right">
              ₱ {grandTotal.toLocaleString()}
            </TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    </div>
  );
};
