import {
  Table,
  TableHead,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
} from "@/app/components/ui/table";
import { useBidderPullOutModalContext } from "@/app/(protected)/auctions/[auction_date]/registered-bidders/[bidder_number]/context/BidderPullOutModalContext";

export const CancelItemsTable: React.FC = () => {
  const { selectedItems } = useBidderPullOutModalContext();
  const tableHeaders = [
    "Barcode",
    "Control",
    "Description",
    "QTY",
    "Manifest",
    "Price",
  ];

  const totalItemPrice = selectedItems.reduce(
    (acc, item) => acc + item.price,
    0,
  );

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
                  ₱{item.price.toLocaleString()}
                </span>
              </div>
            </li>
          ))}
        </ul>
        <div className="mt-2 flex items-baseline justify-between rounded-md bg-secondary px-3 py-2">
          <span className="text-[11.5px] font-semibold uppercase tracking-wider">
            {selectedItems.length} item
            {selectedItems.length === 1 ? "" : "s"} to cancel
          </span>
          <span className="font-mono text-[14px] font-bold">
            ₱{totalItemPrice.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Desktop table */}
      <div className="relative hidden overflow-auto md:block">
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
            {selectedItems.map((item) => (
              <TableRow key={item.auction_inventory_id}>
                <TableCell className="text-center">
                  {item.inventory.barcode}
                </TableCell>
                <TableCell className="text-center">
                  {item.inventory.control}
                </TableCell>
                <TableCell className="text-center">
                  {item.description}
                </TableCell>
                <TableCell className="text-center">{item.qty}</TableCell>
                <TableCell className="text-center">
                  {item.manifest_number}
                </TableCell>
                <TableCell className="border">
                  {item.price.toLocaleString()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
