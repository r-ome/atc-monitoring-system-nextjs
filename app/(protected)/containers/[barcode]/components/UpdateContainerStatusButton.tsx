"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarIcon, Loader2Icon } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/app/components/ui/button";
import { Calendar } from "@/app/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/app/components/ui/popover";
import { toast } from "sonner";
import { updateContainerStatus } from "@/app/(protected)/containers/actions";

interface UpdateContainerStatusButtonProps {
  container_id: string;
  status: "PAID" | "UNPAID";
  paid_at: string | null;
}

export const UpdateContainerStatusButton: React.FC<
  UpdateContainerStatusButtonProps
> = ({ container_id, status, paid_at }) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const submitPaidDate = async (paidDate: string | null) => {
    setIsLoading(true);
    const res = await updateContainerStatus(container_id, paidDate);
    setIsLoading(false);

    if (res.ok) {
      toast.success(
        paidDate ? "Container marked as PAID." : "Container marked as UNPAID.",
      );
      setOpen(false);
      router.refresh();
    } else {
      toast.error(res.error.message);
    }
  };

  if (status === "PAID") {
    return (
      <Button
        variant="outline"
        onClick={() => submitPaidDate(null)}
        disabled={isLoading}
      >
        {isLoading && <Loader2Icon className="animate-spin" />}
        Mark as Unpaid
      </Button>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="default" disabled={isLoading}>
          {isLoading ? (
            <Loader2Icon className="animate-spin" />
          ) : (
            <CalendarIcon />
          )}
          Mark as Paid
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="end">
        <Calendar
          mode="single"
          selected={paid_at ? new Date(paid_at) : undefined}
          disabled={(date) => date > new Date()}
          onSelect={(date) => {
            if (!date) return;
            submitPaidDate(format(date, "yyyy-MM-dd"));
          }}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
};
