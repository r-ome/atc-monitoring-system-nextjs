"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableRow,
  TableFooter,
  TableCell,
} from "@/app/components/ui/table";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { useBidderPullOutModalContext } from "../../context/BidderPullOutModalContext";

export const PaymentBreakdownDetails: React.FC = () => {
  const {
    selectedItems,
    totalItemPrice,
    grandTotal,
    serviceChargeAmount,
    registeredBidder,
    storageFee,
    setStorageFee,
  } = useBidderPullOutModalContext();
  const [showStorageFeeInput, setShowStorageFeeInput] = useState(false);

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

          {showStorageFeeInput ? (
            <TableRow className="[&>td]:border-r last:border-r-0">
              <TableCell className="text-right text-lg">Storage Fee</TableCell>
              <TableCell className="text-right">
                <Input
                  type="number"
                  min={0}
                  className="text-right"
                  value={storageFee === 0 ? "" : storageFee}
                  onChange={(e) =>
                    setStorageFee(
                      e.target.value === "" ? 0 : Number(e.target.value),
                    )
                  }
                />
              </TableCell>
            </TableRow>
          ) : null}

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

      {!showStorageFeeInput && (
        <div className="flex justify-end">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowStorageFeeInput(true)}
          >
            + Add Storage Fee
          </Button>
        </div>
      )}
    </div>
  );
};
