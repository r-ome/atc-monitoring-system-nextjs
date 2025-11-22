"use client";

import { Loader2Icon } from "lucide-react";
import { useState, useEffect } from "react";
import { getBidderByBidderNumber } from "@/app/(protected)/bidders/actions";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { UpdateBidderModal } from "./UpdateBidderModal";
import {
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableCaption,
} from "@/app/components/ui/table";
import { ErrorComponent } from "@/app/components/ErrorComponent";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/app/components/ui/tooltip";
import { Bidder } from "src/entities/models/Bidder";

type Branch = {
  branch_id: string;
  name: string;
};

type BidderResponse =
  | { ok: true; value: Bidder }
  | { ok: false; error: { message: string; cause: string } };

export default function Page() {
  const { bidder_number } = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const branches: Branch[] = session?.user.branches ?? [];
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [selectedBranch, setSelectedBranch] = useState<Branch>(branches[0]);
  const [bidder, setBidder] = useState<Bidder>();
  const [error, setError] = useState<{ message: string; cause: string } | null>(
    null
  );

  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.replace("/login");
    }
  }, [session, status, router]);

  useEffect(() => {
    if (!session) return;
    if (!bidder_number) return;
    if (!branches.length) {
      setIsLoading(false);
      return;
    }

    const fetchInitialData = async () => {
      try {
        setIsLoading(true);

        const bidderUrl = bidder_number.toString().split("-");
        const bidderNumber = bidderUrl[0];
        const bidderBranch = decodeURIComponent(bidderUrl[1]);
        const branch = branches.find((item) => item.name === bidderBranch);
        if (!branch) {
          throw new Error("No branch indicated");
        }

        if (branches) {
        }

        const res: BidderResponse = await getBidderByBidderNumber(
          bidderNumber,
          branch.branch_id
        );

        if (!res.ok) {
          setError(res.error);
          return;
        }

        setBidder(res.value);
      } catch (error) {
        setError({
          message: "Unexpected error while fetching bidder",
          cause: String(error),
        });
      }
    };

    fetchInitialData();
    setIsLoading(false);
  }, [session, branches]);

  if (error) {
    return <ErrorComponent error={error} />;
  }

  // const BidderProfile = () => {
  //   return (
  //     <div className="space-y-2 border-t px-6 pt-6 flex">
  //       {[
  //         {
  //           label: "Service Charge",
  //           value: `${bidder.service_charge}%`,
  //         },
  //         {
  //           label: "Registration Fee",
  //           value: `₱${bidder.registration_fee.toLocaleString()}`,
  //         },
  //         {
  //           label: "Joined at",
  //           value: bidder.created_at,
  //         },
  //         {
  //           label: "Contact Number",
  //           value: bidder.contact_number,
  //         },
  //         {
  //           label: "Birth Date",
  //           value: bidder.birthdate,
  //         },
  //       ].map((detail, i) => (
  //         <div key={i} className="flex flex-col items-center w-1/2">
  //           <p className="text-muted-foreground">{detail.label}</p>{" "}
  //           <p className="text-card-foreground">{detail.value}</p>
  //         </div>
  //       ))}
  //     </div>
  //   );
  // };

  if (!bidder) {
    return;
  }

  return (
    <div className="h-full flex flex-col gap-4 p-4">
      {isLoading ? (
        <Loader2Icon className="animate-spin" />
      ) : (
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
                      Number of days that bidder can pay their items <br />{" "}
                      before they can register in a new auction.
                    </TooltipContent>
                  </Tooltip>
                  {bidder?.payment_term} days
                </p>
              </CardDescription>
            </div>
            {/* <UpdateBidderModal bidder={bidder} /> */}
          </CardHeader>
          {/* <CardContent>
          <BidderProfile />
        </CardContent> */}
        </Card>
      )}

      {/*
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
            {bidder.auctions_joined.map((item) => (
              <TableRow key={item.auction_bidder_id}>
                <TableCell>{item.created_at}</TableCell>
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
      </div> */}
    </div>
  );
}
