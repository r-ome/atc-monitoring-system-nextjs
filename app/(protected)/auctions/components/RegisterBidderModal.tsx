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
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<{
    [key: string]: string;
  }>({ label: "CASH", value: "CASH" });

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

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    if (!selectedBidder || !auction) return;

    const formData = new FormData(event.currentTarget);
    formData.append("auction_id", auction.auction_id);
    formData.append("bidder_id", selectedBidder.value as string);
    const registration_fee = parseInt(
      (formData.get("registration_fee") as string) || "0",
      10
    );
    const balance =
      registration_fee > 1 ? registration_fee * -1 : registration_fee;
    formData.append("balance", balance.toString());
    formData.append("payment_method", selectedPaymentMethod.value as string);

    const res = await registerBidder(formData);
    if (res) {
      setIsLoading(false);
      if (res.ok) {
        toast.success("Successfully Registered Bidder");
        router.refresh();
        setOpen(false);
      }

      if (!res.ok) {
        const description =
          typeof res.error?.cause === "string" ? res.error?.cause : null;
        toast.error(res.error.message, { description });
      }
    }
  };

  // const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
  //   event.preventDefault();
  //   setIsLoading(true);
  //   // bidder_numbers
  //   const bidder_numbers = [
  //     "0003",
  //     "0006",
  //     "0026",
  //     "0028",
  //     "0033",
  //     "0043",
  //     "0044",
  //     "0060",
  //     "0077",
  //     "0096",
  //     "0181",
  //     "0189",
  //     "0207",
  //     "0209",
  //     "0211",
  //     "0219",
  //     "0234",
  //     "0237",
  //     "0256",
  //     "0284",
  //     "0292",
  //     "0458",
  //     "0467",
  //     "0489",
  //     "0529",
  //     "0532",
  //     "0594",
  //     "0667",
  //     "0728",
  //     "0744",
  //     "0755",
  //     "0784",
  //     "0794",
  //     "0819",
  //     "0840",
  //     "0848",
  //     "0857",
  //     "0859",
  //     "0876",
  //     "0889",
  //     "0896",
  //     "0897",
  //     "0904",
  //     "0907",
  //     "0909",
  //     "0911",
  //   ];
  //   const bidder_with_details = bidder_numbers
  //     .filter((item) =>
  //       filteredBidders.find((bidder) => bidder.bidder_number === item)
  //     )
  //     .map((item) => {
  //       const match = filteredBidders.find(
  //         (bidder) => bidder.bidder_number === item
  //       );

  //       return {
  //         bidder_id: match?.bidder_id,
  //         bidder_number: match?.bidder_number,
  //         registration_fee: match?.registration_fee,
  //         service_charge: match?.service_charge,
  //       };
  //     });

  //   await Promise.all(
  //     bidder_with_details.map((item) => {
  //       const formData = new FormData();
  //       formData.append("auction_id", auction.auction_id);
  //       formData.append("bidder_id", item.bidder_id as string);
  //       formData.append(
  //         "registration_fee",
  //         item.registration_fee?.toString() as string
  //       );
  //       formData.append(
  //         "service_charge",
  //         item.service_charge?.toString() as string
  //       );
  //       const balance = (item.registration_fee as number) * -1;
  //       formData.append("balance", balance.toString());
  //       formData.append("payment_method", "CASH");
  //       return registerBidder(formData);
  //     })
  //   );

  //   toast.success("Done!");
  //   router.refresh();
  //   setOpen(false);
  //   setIsLoading(false);
  // };

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
              payment_term: bidder.payment_term,
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
            <div className="flex flex-col gap-2">
              <Label>Payment Term:</Label>

              <InputNumber
                id="payment_term"
                name="payment_term"
                disabled
                hasStepper={false}
                suffix=" days"
                value={selectedBidder?.payment_term as number}
                required
              />
            </div>
          </div>

          <div>
            <div className="flex flex-col gap-2">
              <Label>Payment Method:</Label>

              <SelectWithSearch
                modal={true}
                side="bottom"
                defaultValue={
                  selectedPaymentMethod as { label: string; value: string }
                }
                placeholder="Choose Payment Method"
                setSelected={(selected) =>
                  setSelectedPaymentMethod(selected as Record<string, string>)
                }
                options={[
                  { label: "BDO", value: "BDO" },
                  { label: "BPI", value: "BPI" },
                  { label: "CASH", value: "CASH" },
                  { label: "GCASH", value: "GCASH" },
                ]}
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose className="cursor-pointer">Cancel</DialogClose>
            <Button type="submit" disabled={isLoading || !selectedBidder}>
              {isLoading && <Loader2Icon className="animate-spin" />}
              Submit
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
