"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/app/components/ui/button";
import { Loader2Icon } from "lucide-react";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
  DialogClose,
  DialogFooter,
  DialogHeader,
} from "@/app/components/ui/dialog";

import { SelectWithSearch } from "@/app/components/ui/SelectWithSearch";
import { Bidder } from "src/entities/models/Bidder";
import { getBidders } from "@/app/(protected)/bidders/actions";
import { DialogDescription } from "@radix-ui/react-dialog";
import { registerBidder } from "@/app/(protected)/auctions/actions";
import { InputNumber } from "@/app/components/ui/InputNumber";
import { Label } from "@/app/components/ui/label";
import { Auction } from "src/entities/models/Auction";
import { RegisteredBidder } from "src/entities/models/Bidder";
import { toast } from "sonner";

interface RegisterBidderModalProps {
  auction: Auction;
  registeredBidders: RegisteredBidder[];
}

export const RegisterBidderModal: React.FC<RegisterBidderModalProps> = ({
  auction,
  registeredBidders,
}) => {
  const router = useRouter();
  const [open, setOpen] = useState<boolean>(false);
  const [bidders, setBidders] = useState<Omit<Bidder, "auctions_joined">[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [selectedBidder, setSelectedBidder] = useState<{
    [key: string]: string | number | boolean;
  }>();

  useEffect(() => {
    const fetchInitialData = async () => {
      const res = await getBidders();
      if (res.ok) setBidders(res.value);
    };
    fetchInitialData();
  }, []);

  const filteredBidders = useMemo(() => {
    const registered = new Set(
      registeredBidders.map((item) => item.bidder.bidder_id)
    );
    return bidders.filter((bidder) => !registered.has(bidder.bidder_id));
  }, [bidders, registeredBidders]);

  // const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
  //   event.preventDefault();
  //   setIsLoading(true);
  //   if (!selectedBidder || !auction) return;

  //   const formData = new FormData(event.currentTarget);
  //   formData.append("auction_id", auction.auction_id);
  //   formData.append("bidder_id", selectedBidder.value as string);
  //   const balance = (selectedBidder.registration_fee as number) * -1;
  //   formData.append("balance", balance.toString());
  //   const res = await registerBidder(formData);
  //   if (res) {
  //     setIsLoading(false);
  //     if (res.ok) {
  //       toast.success("Successfully Registered Bidder");
  //       router.refresh();
  //       setOpen(false);
  //     }

  //     if (!res.ok) {
  //       const description =
  //         typeof res.error?.cause === "string" ? res.error?.cause : null;
  //       toast.error(res.error.message, { description });
  //     }
  //   }
  // };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    // bidder_numbers
    const bidder_numbers = [
      "0710",
      "0219",
      "0458",
      "0881",
      "0207",
      "0872",
      "0889",
      "0033",
      "0854",
      "0857",
      "0890",
      "0532",
      "0878",
      "0840",
      "0006",
      "0873",
      "0891",
      "0337",
      "0115",
      "0657",
      "0784",
      "0060",
      "0848",
      "0740",
      "0761",
      "0643",
      "0003",
      "0269",
      "0189",
      "0810",
      "0738",
      "0041",
      "0338",
      "0211",
      "0028",
      "0819",
      "0724",
      "0077",
      "0824",
      "0786",
      "0171",
      "0755",
      "0847",
      "0297",
      "0772",
      "0718",
      "0633",
      "0827",
      "0845",
      "0256",
      "0518",
      "0044",
      "0043",
      "0744",
      "0842",
      "0663",
      "0533",
      "0234",
      "0529",
      "0008",
      "0802",
      "0031",
      "0642",
      "0708",
      "0540",
      "0204",
      "0594",
      "0841",
    ];
    const bidder_with_details = bidder_numbers
      .filter((item) =>
        filteredBidders.find((bidder) => bidder.bidder_number === item)
      )
      .map((item) => {
        const match = filteredBidders.find(
          (bidder) => bidder.bidder_number === item
        );

        return {
          bidder_id: match?.bidder_id,
          bidder_number: match?.bidder_number,
          registration_fee: match?.registration_fee,
          service_charge: match?.service_charge,
        };
      });

    await Promise.all(
      bidder_with_details.map((item) => {
        const formData = new FormData();
        formData.append("auction_id", auction.auction_id);
        formData.append("bidder_id", item.bidder_id as string);
        formData.append(
          "registration_fee",
          item.registration_fee?.toString() as string
        );
        formData.append(
          "service_charge",
          item.service_charge?.toString() as string
        );
        const balance = (item.registration_fee as number) * -1;
        formData.append("balance", balance.toString());
        return registerBidder(formData);
      })
    );

    toast.success("Done!");
    router.refresh();
    setOpen(false);
    setIsLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Register Bidder</Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>Register Bidder</DialogTitle>
            <DialogDescription>
              Please select a bidder to register
            </DialogDescription>
          </DialogHeader>

          <SelectWithSearch
            modal={true}
            side="bottom"
            placeholder="Search Bidder to register"
            setSelected={(selected) => setSelectedBidder(selected)}
            options={filteredBidders.map((bidder) => ({
              label: `${bidder.full_name} (${bidder.bidder_number}) ${
                bidder.status === "BANNED" ? bidder.status : ""
              }`,
              value: bidder.bidder_id,
              disabled: bidder.status === "BANNED",
              registration_fee: bidder.registration_fee,
              service_charge: bidder.service_charge,
            }))}
          />
          <div className="flex gap-4">
            <div className="flex flex-col gap-2">
              <Label>Service Charge:</Label>
              <InputNumber
                id="service_charge"
                name="service_charge"
                defaultValue={12}
                value={selectedBidder?.service_charge as number}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Registration Fee:</Label>

              <InputNumber
                id="registration_fee"
                name="registration_fee"
                defaultValue={3000}
                value={selectedBidder?.registration_fee as number}
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose className="cursor-pointer">Cancel</DialogClose>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2Icon className="animate-spin" />}
              Submit
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
