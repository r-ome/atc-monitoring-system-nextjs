"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/app/components/ui/button";
import { TriangleAlert, Loader2Icon } from "lucide-react";
import { undoPayment } from "../actions";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/app/components/ui/alert-dialog";

interface UndoPaymentButtonProps {
  receipt_id: string;
}

export const UndoPaymentButton: React.FC<UndoPaymentButtonProps> = ({
  receipt_id,
}) => {
  const router = useRouter();
  const [openAlertDialog, setOpenAlertDialog] = useState<boolean>(false);
  const [openFinalAlertDialog, setOpenFinalAlertDialog] =
    useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleSubmit = async () => {
    setOpenAlertDialog(false);
    setOpenFinalAlertDialog(true);
  };

  const handleFinalSubmit = async () => {
    setIsLoading(true);

    const res = await undoPayment(receipt_id);
    if (res) {
      if (res.ok) {
        toast.success("Successfully UNDID the payment!");
        setOpenAlertDialog(false);
        setOpenFinalAlertDialog(false);
        router.back();
      }

      if (!res.ok) {
        const description =
          typeof res.error?.cause === "string" ? res.error?.cause : null;
        toast.error(res.error.message, { description });
      }
    }
    setIsLoading(false);
  };

  return (
    <>
      <Button
        variant={"destructive"}
        onClick={async () => {
          setOpenAlertDialog(true);
        }}
      >
        UNDO PAYMENT
      </Button>

      <AlertDialog
        open={openAlertDialog}
        onOpenChange={(open) => {
          setOpenAlertDialog(open);
          if (!open) {
            setIsLoading(false);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              <div className="flex mx-auto gap-2 items-center">
                <TriangleAlert className="h-7 w-7 text-destructive" />
                UNDO PAYMENT
              </div>
            </AlertDialogTitle>
            <AlertDialogDescription className="flex flex-col gap-2 text-black-500">
              <div>
                <span>
                  CONFIRMING WILL COMPLETE THE UNDO OF THIS PAYMENT AND CANNOT
                  BE UNDONE!
                </span>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>

            <Button
              type="button"
              disabled={isLoading}
              onClick={handleSubmit}
            >
              SUBMIT
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={openFinalAlertDialog}
        onOpenChange={(open) => {
          setOpenFinalAlertDialog(open);
          if (!open) {
            setIsLoading(false);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              <div className="flex mx-auto gap-2 items-center">
                <TriangleAlert className="h-7 w-7 text-destructive" />
                FINAL WARNING
              </div>
            </AlertDialogTitle>
            <AlertDialogDescription className="text-black-500">
              This will reset the receipt&apos;s paid items back to UNPAID and
              restore the bidder&apos;s balance. Press CONFIRM again to proceed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Back</AlertDialogCancel>
            <Button
              type="button"
              disabled={isLoading}
              onClick={handleFinalSubmit}
            >
              {isLoading && <Loader2Icon className="animate-spin" />}
              CONFIRM
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
