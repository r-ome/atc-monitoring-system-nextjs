"use client";

import { SetStateAction, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/app/components/ui/button";
import { Loader2Icon } from "lucide-react";
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogContent,
  DialogFooter,
} from "@/app/components/ui/dialog";
import {
  Stepper,
  StepperTitle,
  StepperDescription,
  StepperIndicator,
  StepperItem,
  StepperSeparator,
  StepperTrigger,
} from "@/app/components/ui/stepper";
import { PullOutItemsTable } from "@/app/(protected)/auctions/[auction_date]/registered-bidders/[bidder_number]/components/PullOutModal/PullOutItemsTable";
import { PaymentBreakdownDetails } from "@/app/(protected)/auctions/[auction_date]/registered-bidders/[bidder_number]/components/PullOutModal/PaymentBreakdownDetails";
import { handleBidderPullOut } from "@/app/(protected)/auctions/actions";
import { ConfirmPayment } from "@/app/(protected)/auctions/[auction_date]/registered-bidders/[bidder_number]/components/PullOutModal/ConfirmPayment";
import { useBidderPullOutModalContext } from "@/app/(protected)/auctions/[auction_date]/registered-bidders/[bidder_number]/context/BidderPullOutModalContext";
import { toast } from "sonner";

interface PullOutModalProps {
  open: boolean;
  onOpenChange: React.Dispatch<SetStateAction<boolean>>;
}

const steps = [
  {
    step: 1,
    title: "Item List",
    description: "Double-check the items listed and the breakdown of billing",
  },
  {
    step: 2,
    title: "Payment Details",
    description: "Breakdown of the payment details",
  },
  {
    step: 3,
    title: "Confirm Payment",
    description: "Confirm billing with the bidder",
  },
];

export const PullOutModal: React.FC<PullOutModalProps> = ({
  open,
  onOpenChange,
}) => {
  const {
    selectedItems,
    registeredBidder: bidderPaymentDetails,
    grandTotal,
  } = useBidderPullOutModalContext();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setIsLoading(true);
    if (bidderPaymentDetails) {
      formData.append(
        "auction_bidder_id",
        bidderPaymentDetails.auction_bidder_id
      );
    }

    formData.append(
      "auction_inventory_ids",
      JSON.stringify(selectedItems.map((item) => item.auction_inventory_id))
    );

    formData.append("amount_to_be_paid", grandTotal.toString());

    const res = await handleBidderPullOut(formData);

    if (res) {
      if (res.ok) {
        toast.success("Success!", {
          description: `Successfully paid ${grandTotal.toLocaleString()} from Bidder ${
            bidderPaymentDetails?.bidder.bidder_number
          }!`,
        });
        router.refresh();
        onOpenChange(false);
        setCurrentStep(1);
      }

      if (!res.ok) {
        const description =
          typeof res.error?.cause === "string" ? res.error?.cause : null;
        toast.error(res.error.message, { description });
      }
      setIsLoading(false);
    }
  };

  const PullOutSteps = () => {
    return (
      <div className="space-y-2">
        <Stepper value={currentStep}>
          {steps.map(({ step, title, description }) => (
            <StepperItem
              key={step}
              step={step}
              className="relative flex-1 flex-col!"
            >
              <StepperTrigger className="flex-col gap-3 rounded">
                <StepperIndicator />
                <div className="space-y-0.5 px-2">
                  <StepperTitle>{title}</StepperTitle>
                  <StepperDescription className="max-sm:hidden">
                    {description}
                  </StepperDescription>
                </div>
              </StepperTrigger>
              {step < steps.length && (
                <StepperSeparator className="absolute inset-x-0 top-3 left-[calc(50%+0.75rem+0.125rem)] -order-1 m-0 -translate-y-1/2 group-data-[orientation=horizontal]/stepper:w-[calc(100%-1.5rem-0.25rem)] group-data-[orientation=horizontal]/stepper:flex-none" />
              )}
            </StepperItem>
          ))}
        </Stepper>

        {currentStep === 1 && (
          <div className="px-6 mt-5">
            <PullOutItemsTable />
          </div>
        )}

        <form onSubmit={handleSubmit} id="bidder-payment-form">
          {currentStep === 2 && (
            <div className="px-6 mt-5">
              <PaymentBreakdownDetails />
            </div>
          )}

          {currentStep === 3 && (
            <div className="px-6 mt-5">
              <ConfirmPayment />
            </div>
          )}
        </form>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="min-w-[800px]">
        <DialogHeader>
          <DialogTitle>Pull Out</DialogTitle>
        </DialogHeader>

        <PullOutSteps />

        <DialogFooter className="flex sm:justify-center">
          <Button
            variant="outline"
            className="w-40"
            onClick={() => setCurrentStep((prev) => prev - 1)}
            disabled={currentStep === 1}
          >
            Prev step
          </Button>

          {currentStep === 3 ? (
            <Button
              type="submit"
              form="bidder-payment-form"
              className="w-40"
              disabled={isLoading}
            >
              {isLoading && <Loader2Icon className="animate-spin" />}
              Submit
            </Button>
          ) : (
            <Button
              variant="outline"
              className="w-40"
              onClick={() => setCurrentStep((prev) => prev + 1)}
              disabled={currentStep >= steps.length}
            >
              Next step
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
