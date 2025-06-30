import {
  Table,
  TableHead,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
} from "@/app/components/ui/table";
import { useBidderPullOutModalContext } from "@/app/(protected)/auctions/[auction_date]/registered-bidders/[bidder_number]/context/BidderPullOutModalContext";
import { InputNumber } from "@/app/components/ui/InputNumber";

interface RefundItemsTableProps {
  handlePriceUpdate: (auctionInventoryId: string, newPrice: number) => void;
}

export const RefundItemsTable: React.FC<RefundItemsTableProps> = ({
  handlePriceUpdate,
}) => {
  const { selectedItems } = useBidderPullOutModalContext();
  const tableHeaders = [
    "Barcode",
    "Control",
    "Description",
    "QTY",
    "Manifest",
    "Price",
    "New Price",
  ];

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
          {selectedItems.map((item) => (
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
                  defaultValue={item.price}
                  hasStepper={false}
                  max={item.price}
                  onChange={(e) =>
                    handlePriceUpdate(
                      item.auction_inventory_id,
                      parseInt(e.target.value, 10)
                    )
                  }
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
