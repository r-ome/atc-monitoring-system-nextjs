"use client";

import { redirect } from "next/navigation";
import {
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableCaption,
} from "@/app/components/ui/table";
import { formatDate } from "@/app/lib/utils";

interface AuctionsJoinedProps {
  bidderNumber: string;
  auctionsJoined: {
    created_at: string;
    auction_bidder_id: string;
    service_charge: number;
    registration_fee: number;
    balance: number;
    auctions_inventories: object[];
  }[];
}

const AuctionsJoined = ({
  auctionsJoined,
  bidderNumber,
}: AuctionsJoinedProps) => {
  return (
    <div className="border rounded-2xl p-2">
      <Table>
        <TableCaption>Auctions Joined</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Auction Date</TableHead>
            <TableHead>Service Charge</TableHead>
            <TableHead>Registration Fee</TableHead>
            <TableHead>Balance</TableHead>
            <TableHead>Total Items</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {auctionsJoined
            .sort((a, b) => a.created_at.localeCompare(b.created_at))
            .map((item) => (
              <TableRow key={item.auction_bidder_id}>
                <TableCell>
                  <div
                    className="hover:cursor-pointer hover:underline"
                    onClick={() =>
                      redirect(
                        `/auctions/${formatDate(
                          new Date(item.created_at),
                          "yyyy-MM-dd"
                        )}/registered-bidders/${bidderNumber}`
                      )
                    }
                  >
                    {/* /0219 */}
                    {item.created_at}
                  </div>
                </TableCell>
                <TableCell>{item.service_charge}%</TableCell>
                <TableCell>{item.registration_fee.toLocaleString()}</TableCell>
                <TableCell>₱{item.balance.toLocaleString()}</TableCell>
                <TableCell>
                  {(item.auctions_inventories || []).length}
                </TableCell>
              </TableRow>
            ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default AuctionsJoined;
