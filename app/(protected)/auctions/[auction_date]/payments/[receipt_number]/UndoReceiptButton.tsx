"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/app/components/ui/button";
import { TriangleAlert, Loader2Icon } from "lucide-react";
import { undoPayment } from "../actions";
import { PasswordInput } from "@/app/components/ui/input-password";
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
import { Label } from "@/app/components/ui/label";

interface UndoPaymentButtonProps {
  receipt_id: string;
}

export const UndoPaymentButton: React.FC<UndoPaymentButtonProps> = ({
  receipt_id,
}) => {
  const router = useRouter();
  const [openAlertDialog, setOpenAlertDialog] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [password, setPassword] = useState<string>("");
  const [disableConfirm, setDisableConfirm] = useState<boolean>(true);

  useEffect(() => {
    if (password === "helloworld") {
      setDisableConfirm(false);
    }
  }, [password]);

  const handleSubmit = async () => {
    setIsLoading(true);

    const res = await undoPayment(receipt_id);
    if (res) {
      if (res.ok) {
        toast.success("Successfully UNDID the payment!");
        setOpenAlertDialog(false);
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
        onClick={async () => setOpenAlertDialog(true)}
      >
        UNDO PAYMENT
      </Button>

      <AlertDialog open={openAlertDialog} onOpenChange={setOpenAlertDialog}>
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
              <div>
                <div className="flex gap-4">
                  <Label htmlFor="password" className="w-40">
                    Password:
                  </Label>
                  <div className="w-full">
                    <PasswordInput
                      value={password}
                      name="password"
                      onChange={(e) =>
                        setPassword(e.target.value.toLowerCase())
                      }
                    />
                  </div>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>

            <AlertDialogAction asChild>
              <Button
                type="button"
                disabled={disableConfirm || isLoading}
                onClick={handleSubmit}
              >
                {isLoading && <Loader2Icon className="animate-spin" />}
                CONFIRM
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
