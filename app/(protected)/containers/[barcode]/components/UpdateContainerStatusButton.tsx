"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2Icon } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { toast } from "sonner";
import { updateContainerStatus } from "@/app/(protected)/containers/actions";

interface UpdateContainerStatusButtonProps {
  container_id: string;
  status: "PAID" | "UNPAID";
}

export const UpdateContainerStatusButton: React.FC<
  UpdateContainerStatusButtonProps
> = ({ container_id, status }) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const nextStatus = status === "UNPAID" ? "PAID" : "UNPAID";
  const label = status === "UNPAID" ? "Mark as Paid" : "Mark as Unpaid";

  const handleClick = async () => {
    setIsLoading(true);
    const res = await updateContainerStatus(container_id, nextStatus);
    setIsLoading(false);

    if (res.ok) {
      toast.success(`Container marked as ${nextStatus}.`);
      router.refresh();
    } else {
      toast.error(res.error.message);
    }
  };

  return (
    <Button
      variant={status === "UNPAID" ? "default" : "outline"}
      onClick={handleClick}
      disabled={isLoading}
    >
      {isLoading && <Loader2Icon className="animate-spin" />}
      {label}
    </Button>
  );
};
