import {
  Table,
  TableHead,
  TableHeader,
  TableBody,
  TableRow,
  TableFooter,
  TableCell,
} from "@/app/components/ui/table";
import { useBidderPullOutModalContext } from "@/app/(protected)/auctions/[auction_date]/registered-bidders/[bidder_number]/context/BidderPullOutModalContext";
import {
  getAuctionInventoriesPayableBase,
  getAuctionInventoryPayableBase,
} from "src/entities/models/AuctionPayableAmount";

export const PullOutItemsTable: React.FC = () => {
  const { selectedItems } = useBidderPullOutModalContext();
  const tableHeaders = [
    "Barcode",
    "Control",
    "Description",
    "QTY",
    "Manifest",
    "Price",
  ];
  const totalItemPrice = getAuctionInventoriesPayableBase(selectedItems);

  return (
    <div className="mx-auto w-full sm:w-5/6">
      {/* Mobile card list */}
      <div className="md:hidden">
        <ul className="flex max-h-[260px] flex-col overflow-y-auto rounded-md border">
          {selectedItems.map((item, i) => (
            <li
              key={item.auction_inventory_id}
              className={`flex flex-col gap-1 px-3 py-2.5 ${
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
                <span className="line-clamp-1 text-[12.5px]">
                  {item.description}
                </span>
                {item.qty ? (
                  <span className="font-mono text-[11px] text-muted-foreground">
                    ×{item.qty}
                  </span>
                ) : null}
                <span className="ml-auto font-mono text-[12.5px] font-semibold">
                  ₱{getAuctionInventoryPayableBase(item).toLocaleString()}
                </span>
              </div>
            </li>
          ))}
        </ul>
        <div className="mt-2 flex items-baseline justify-between rounded-md bg-secondary px-3 py-2">
          <span className="text-[11.5px] font-semibold uppercase tracking-wider">
            Total Items Price
          </span>
          <span className="font-mono text-[14px] font-bold">
            ₱{totalItemPrice.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Desktop table */}
      <div className="relative hidden h-[300px] overflow-auto md:block">
        <Table>
          <TableHeader className="sticky top-0 bg-secondary">
            <TableRow>
              {tableHeaders.map((item) => (
                <TableHead key={item}>{item}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {selectedItems.map((item) => (
              <TableRow key={item.auction_inventory_id}>
                <TableCell>{item.inventory.barcode}</TableCell>
                <TableCell>{item.inventory.control}</TableCell>
                <TableCell>{item.description}</TableCell>
                <TableCell>{item.qty}</TableCell>
                <TableCell>{item.manifest_number}</TableCell>
                <TableCell className="border">
                  {getAuctionInventoryPayableBase(item).toLocaleString()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableFooter className="sticky bottom-0 bg-secondary">
            <TableRow>
              <TableCell colSpan={4}></TableCell>
              <TableCell className="font-bold text-right">
                Total ITEMS Price
              </TableCell>
              <TableCell className="font-bold">
                {totalItemPrice.toLocaleString()}
              </TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </div>
    </div>
  );
};
