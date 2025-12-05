import { getBidderByBidderNumber } from "@/app/(protected)/bidders/actions";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { UpdateBidderModal } from "./UpdateBidderModal";
import { ErrorComponent } from "@/app/components/ErrorComponent";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/app/components/ui/tooltip";
import AuctionsJoined from "./components/AuctionsJoinedTable";
import { redirect } from "next/navigation";

export default async function Page({
  params,
}: Readonly<{ params: Promise<{ bidder_number: string }> }>) {
  const { bidder_number } = await params;

  const res = await getBidderByBidderNumber(bidder_number);

  if (!res.ok) {
    return <ErrorComponent error={res.error} />;
  }

  const bidder = res.value;
  const BidderProfile = () => {
    return (
      <div className="space-y-2 border-t px-6 pt-6 flex">
        {[
          {
            label: "Service Charge",
            value: `${bidder.service_charge}%`,
          },
          {
            label: "Registration Fee",
            value: `₱${bidder.registration_fee.toLocaleString()}`,
          },
          {
            label: "Joined at",
            value: bidder.created_at,
          },
          {
            label: "Contact Number",
            value: bidder.contact_number,
          },
          {
            label: "Birth Date",
            value: bidder.birthdate,
          },
        ].map((detail, i) => (
          <div key={i} className="flex flex-col items-center w-1/2">
            <p className="text-muted-foreground">{detail.label}</p>{" "}
            <p className="text-card-foreground">{detail.value}</p>
          </div>
        ))}
      </div>
    );
  };

  if (!bidder) {
    return redirect("/bidders");
  }

  return (
    <div className="h-full flex flex-col gap-4 p-4">
      <Card className="w-full">
        <CardHeader className="flex justify-between">
          <div>
            <CardTitle>
              Bidder: {bidder.bidder_number}{" "}
              <Badge
                variant={
                  ["INACTIVE", "BANNED"].includes(bidder.status)
                    ? "destructive"
                    : "success"
                }
              >
                {bidder.status}
              </Badge>
            </CardTitle>
            <CardDescription>
              <p>{bidder.full_name}</p>
              <p>Address: {bidder?.address}</p>
              <p>TIN Number: {bidder?.tin_number}</p>
              <p>Store Name: {bidder?.store_name}</p>
              <p>
                <Tooltip>
                  <TooltipTrigger className="overflow-hidden whitespace-nowrap text-ellipsis max-w-[200px]">
                    Payment Term:
                  </TooltipTrigger>
                  <TooltipContent side="left">
                    Number of days that bidder can pay their items <br /> before
                    they can register in a new auction.
                  </TooltipContent>
                </Tooltip>
                {bidder?.payment_term} days
              </p>
            </CardDescription>
          </div>
          <UpdateBidderModal bidder={bidder} />
        </CardHeader>
        <CardContent>
          <BidderProfile />
        </CardContent>
      </Card>

      <AuctionsJoined
        auctionsJoined={bidder.auctions_joined}
        bidderNumber={bidder.bidder_number}
      />
    </div>
  );
}
