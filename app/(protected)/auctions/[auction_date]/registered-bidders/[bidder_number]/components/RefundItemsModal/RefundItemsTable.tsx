"use client";

import { useState, useEffect, SetStateAction } from "react";
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
  totalRefundAmount: number;
  setTotalRefundAmount: React.Dispatch<SetStateAction<number>>;
}

export const RefundItemsTable: React.FC<RefundItemsTableProps> = ({
  handlePriceUpdate,
  totalRefundAmount,
  setTotalRefundAmount,
}) => {
  const { selectedItems, serviceCharge } = useBidderPullOutModalContext();
  const [refundAmount, setRefundAmount] = useState<Record<string, number>>(
    selectedItems.reduce<Record<string, number>>((acc, item) => {
      acc[item.auction_inventory_id] = item.price;
      return acc;
    }, {})
  );

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
  }, [refundAmount, setTotalRefundAmount]);

  const grandTotal = getItemPriceWithServiceChargeAmount(
    totalRefundAmount,
    serviceCharge,
  );

  return (
    <div className="mx-auto">
      {/* Mobile card list */}
      <div className="md:hidden">
        <ul className="flex max-h-[300px] flex-col overflow-y-auto rounded-md border">
          {selectedItems.map((item, i) => {
            const difference = refundAmount[item.auction_inventory_id];
            const isFullRefund = item.price === difference;
            return (
              <li
                key={item.auction_inventory_id}
                className={`flex flex-col gap-2 px-3 py-3 ${
                  i !== selectedItems.length - 1 ? "border-b" : ""
                }`}
              >
                <div className="flex items-baseline gap-1.5">
                  <span className="font-mono text-[12px] font-semibold">
                    {item.inventory.barcode}
                  </span>
                  <span className="font-mono text-[10.5px] text-muted-foreground">
                    · {item.inventory.control}
                  </span>
                  {item.manifest_number ? (
                    <span className="ml-auto rounded bg-secondary px-1.5 py-0.5 font-mono text-[10.5px] font-semibold text-foreground/80">
                      {item.manifest_number}
                    </span>
                  ) : null}
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="line-clamp-1 flex-1 text-[12.5px]">
                    {item.description}
                  </span>
                  {item.qty ? (
                    <span className="font-mono text-[11px] text-muted-foreground">
                      ×{item.qty}
                    </span>
                  ) : null}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-muted-foreground">
                    Original
                  </span>
                  <span className="font-mono text-[12px]">
                    ₱{item.price.toLocaleString()}
                  </span>
                  <span className="ml-auto text-[11px] text-muted-foreground">
                    New
                  </span>
                  <div className="w-[110px]">
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
                  </div>
                </div>
                <div className="flex items-center justify-between border-t pt-2">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Refund
                  </span>
                  {isFullRefund ? (
                    <Badge variant="destructive">FULL REFUND</Badge>
                  ) : (
                    <span className="font-mono text-[13px] font-bold text-destructive">
                      ₱{(isNaN(difference) ? 0 : difference).toLocaleString()}
                    </span>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
        <div className="mt-2 flex flex-col gap-1 rounded-md bg-secondary px-3 py-2">
          <div className="flex items-baseline justify-between">
            <span className="text-[11.5px] font-semibold uppercase tracking-wider">
              Total Refund
            </span>
            <span className="font-mono text-[13px] font-bold">
              ₱{(isNaN(totalRefundAmount) ? 0 : totalRefundAmount).toLocaleString()}
            </span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-[11px] text-muted-foreground">
              Grand Total · SC {serviceCharge}%
            </span>
            <span className="font-mono text-[14px] font-bold text-destructive">
              ₱{(isNaN(grandTotal) ? 0 : grandTotal).toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Desktop table */}
      <div className="relative hidden max-h-[300px] overflow-auto md:block">
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
                ₱ {isNaN(grandTotal) ? 0 : grandTotal}
              </TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </div>
    </div>
  );
};
