"use client";

import { SetStateAction, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/app/components/ui/button";
import { OctagonAlert, Loader2Icon } from "lucide-react";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/app/components/ui/alert-dialog";
import { formatDate } from "@/app/lib/utils";

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
  const params = useParams();
  const {
    selectedItems,
    registeredBidder: bidderPaymentDetails,
    grandTotal,
  } = useBidderPullOutModalContext();

  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [openAlertDialog, setOpenAlertDialog] = useState<boolean>(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!bidderPaymentDetails) return;
    if (!openAlertDialog) {
      setOpenAlertDialog(true);
      return;
    }

    const formData = new FormData(event.currentTarget);
    setIsLoading(true);
    formData.append(
      "auction_bidder_id",
      bidderPaymentDetails.auction_bidder_id,
    );

    formData.append(
      "auction_inventory_ids",
      JSON.stringify(selectedItems.map((item) => item.auction_inventory_id)),
    );

    formData.append("amount_to_be_paid", grandTotal.toString());
    const data = Object.fromEntries(formData.entries());
    const bidder_payments = Object.keys(data)
      .filter((key) => key.includes("PAYMENT_"))
      .map((key) => ({
        payment_method: key.replace("PAYMENT_", "").split("_")[0],
        amount_paid: typeof data[key] === "string" ? parseInt(data[key]) : 0,
      }));

    formData.append("payments", JSON.stringify(bidder_payments));
    for (const key of Array.from(formData.keys())) {
      if (key.startsWith("PAYMENT_")) {
        formData.delete(key);
      }
    }

    const res = await handleBidderPullOut(formData);

    if (res) {
      if (res.ok) {
        localStorage.removeItem(bidderPaymentDetails.auction_bidder_id);
        toast.success("Success!", {
          description: `Successfully paid ${grandTotal.toLocaleString()} from Bidder ${
            bidderPaymentDetails?.bidder.bidder_number
          }!`,
        });
        setOpenAlertDialog(false);
        router.refresh();
        onOpenChange(false);
        setCurrentStep(1);
      } else {
        if (res.error.message === "Server Error") {
          toast.error(res.error.message);
        }
        const cause = res.error.cause as Record<string, string[]> | undefined;
        const description = cause
          ? Object.entries(cause)
              .map(([, msgs]) => `${msgs.join(", ")}`)
              .join(" | ")
          : undefined;

        toast.error(res.error.message, { description });
      }
    }
    setIsLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="min-w-[800px]">
        <form id="bidder-payment-form" onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Pull Out</DialogTitle>
          </DialogHeader>

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
                    <StepperSeparator className="absolute inset-x-0 top-3 left-[calc(50%+0.75rem+0.125rem)]" />
                  )}
                </StepperItem>
              ))}
            </Stepper>

            {currentStep === 1 && (
              <div className="px-6 mt-5">
                <PullOutItemsTable />
              </div>
            )}

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
          </div>

          <AlertDialog open={openAlertDialog} onOpenChange={setOpenAlertDialog}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  <div className="flex mx-auto gap-2">
                    <OctagonAlert className="h-7 w-7 text-destructive" />
                    BIDDER {bidderPaymentDetails?.bidder.bidder_number} PULL OUT{" "}
                    {params.auction_date
                      ? `(${formatDate(
                          new Date(params.auction_date.toString()),
                          "MMMM dd, yyyy",
                        )})`
                      : null}
                  </div>
                </AlertDialogTitle>

                <AlertDialogDescription>
                  Confirming will complete the payment and cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>

              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>

                <AlertDialogAction asChild>
                  <Button
                    type="button"
                    disabled={isLoading}
                    onClick={() => {
                      const form = document.getElementById(
                        "bidder-payment-form",
                      ) as HTMLFormElement;

                      form.requestSubmit();
                    }}
                  >
                    {isLoading && <Loader2Icon className="animate-spin" />}
                    Confirm
                  </Button>
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <DialogFooter className="flex sm:justify-center mt-4">
            <Button
              type="button"
              variant="outline"
              className="w-40"
              onClick={() => setCurrentStep((prev) => prev - 1)}
              disabled={currentStep === 1}
            >
              Prev step
            </Button>

            {currentStep === 3 ? (
              <Button
                type="button"
                className="w-40"
                onClick={() => setOpenAlertDialog(true)}
                disabled={isLoading}
              >
                Submit
              </Button>
            ) : (
              <Button
                type="button"
                variant="outline"
                className="w-40"
                onClick={() => setCurrentStep((prev) => prev + 1)}
                disabled={currentStep >= steps.length}
              >
                Next step
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
