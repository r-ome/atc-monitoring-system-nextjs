"use client";

import { useState, useEffect } from "react";
import {
  Table,
  TableHead,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
  TableFooter,
} from "@/app/components/ui/table";
import { useBidderPullOutModalContext } from "@/app/(protected)/auctions/[auction_date]/registered-bidders/[bidder_number]/context/BidderPullOutModalContext";
import { InputNumber } from "@/app/components/ui/InputNumber";
import { getItemPriceWithServiceChargeAmount } from "@/app/lib/utils";
import { Badge } from "@/app/components/ui/badge";

interface RefundItemsTableProps {
  handlePriceUpdate: (auctionInventoryId: string, newPrice: number) => void;
}

export const RefundItemsTable: React.FC<RefundItemsTableProps> = ({
  handlePriceUpdate,
}) => {
  const { selectedItems, serviceCharge } = useBidderPullOutModalContext();
  const [refundAmount, setRefundAmount] = useState<Record<string, number>>(
    selectedItems.reduce<Record<string, number>>((acc, item) => {
      acc[item.auction_inventory_id] = item.price;
      return acc;
    }, {})
  );
  const [totalRefundAmount, setTotalRefundAmount] = useState<number>(0);
  const tableHeaders = [
    "Barcode",
    "Control",
    "Description",
    "QTY",
    "Manifest",
    "Price",
    "New Price",
    "Refund Price",
  ];

  useEffect(() => {
    const totalRefund = Object.values(refundAmount).reduce(
      (acc, item) => (acc += item),
      0
    );
    setTotalRefundAmount(totalRefund);
  }, [refundAmount]);

  return (
    <div className="mx-auto relative overflow-auto max-h-[300px]">
      <Table>
        <TableHeader className="sticky top-0 bg-secondary">
          <TableRow>
            {tableHeaders.map((item) => (
              <TableHead key={item} className="text-center">
                {item}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody className="border">
          {selectedItems.map((item) => {
            const difference = refundAmount[item.auction_inventory_id];
            return (
              <TableRow key={item.auction_inventory_id}>
                <TableCell className="text-center w-[100px]">
                  {item.inventory.barcode}
                </TableCell>
                <TableCell className="text-center w-[100px]">
                  {item.inventory.control}
                </TableCell>
                <TableCell className="text-center w-[100px]">
                  {item.description}
                </TableCell>
                <TableCell className="text-center w-[100px]">
                  {item.qty}
                </TableCell>
                <TableCell className="text-center w-[100px]">
                  {item.manifest_number}
                </TableCell>
                <TableCell className="text-center w-[150px]">
                  {item.price.toLocaleString()}
                </TableCell>
                <TableCell className="w-[150px]">
                  <InputNumber
                    required
                    value={item.price}
                    hasStepper={false}
                    min={0}
                    max={item.price}
                    onChange={(e) => {
                      const newPrice = parseInt(e.target.value, 10);
                      setRefundAmount((prev) => ({
                        ...prev,
                        [item.auction_inventory_id]:
                          item.price <= newPrice
                            ? item.price
                            : item.price - newPrice,
                      }));

                      handlePriceUpdate(item.auction_inventory_id, newPrice);
                    }}
                  />
                </TableCell>

                <TableCell className="text-center w-[150px] text-red-500">
                  {item.price === refundAmount[item.auction_inventory_id] ? (
                    <Badge variant={"destructive"}>FULL REFUND</Badge>
                  ) : isNaN(difference) ? (
                    0
                  ) : (
                    difference
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell className="text-right text-lg" colSpan={7}>
              Total Item <span className="text-red-500">REFUND</span> Price
            </TableCell>
            <TableCell className="text-lg font-bold text-center">
              ₱ {isNaN(totalRefundAmount) ? 0 : totalRefundAmount}
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="text-right text-lg" colSpan={7}>
              Grand Total w/ Service Charge ({serviceCharge}%)
            </TableCell>
            <TableCell className="text-lg font-bold text-center text-red-500">
              ₱{" "}
              {isNaN(
                getItemPriceWithServiceChargeAmount(
                  totalRefundAmount,
                  serviceCharge
                )
              )
                ? 0
                : getItemPriceWithServiceChargeAmount(
                    totalRefundAmount,
                    serviceCharge
                  )}
            </TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    </div>
  );
};
