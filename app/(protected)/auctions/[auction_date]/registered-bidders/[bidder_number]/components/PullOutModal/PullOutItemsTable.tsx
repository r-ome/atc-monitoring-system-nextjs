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
  const totalItemPrice = selectedItems.reduce((acc, item) => {
    return (acc += item.price);
  }, 0);

  return (
    <div className="w-5/6 mx-auto h-[300px] relative overflow-auto">
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
                {item.price.toLocaleString()}
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
  );
};
