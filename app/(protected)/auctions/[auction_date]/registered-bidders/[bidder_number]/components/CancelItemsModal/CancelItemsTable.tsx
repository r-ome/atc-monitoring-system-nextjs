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

  return (
    <div className="w-5/6 mx-auto relative overflow-auto">
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
              <TableCell className="text-center">{item.description}</TableCell>
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
  );
};
