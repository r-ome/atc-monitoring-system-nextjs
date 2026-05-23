"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2Icon, Tag } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/app/components/ui/dialog";
import { Button } from "@/app/components/ui/button";
import { Label } from "@/app/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import {
  CANCEL_REFUND_TAG_LABELS,
  CANCEL_REFUND_TAG_VALUES,
  CancelRefundTag,
} from "src/entities/models/InventoryHistoryRemark";
import { RefundCancellationEntry } from "src/entities/models/Report";
import { updateRefundCancellationTag } from "../actions";

interface Props {
  entry: RefundCancellationEntry | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const UpdateTagModal = ({ entry, open, onOpenChange }: Props) => {
  const router = useRouter();
  const [tag, setTag] = useState<CancelRefundTag>(entry?.tag ?? "OTHER");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (open && entry) setTag(entry.tag ?? "OTHER");
  }, [open, entry]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!entry) return;
    setIsLoading(true);
    const res = await updateRefundCancellationTag({
      auction_inventory_id: entry.auction_inventory_id,
      tag,
    });
    setIsLoading(false);

    if (res.ok) {
      toast.success("Tag updated.");
      router.refresh();
      onOpenChange(false);
      return;
    }

    const description =
      typeof res.error?.cause === "string" ? res.error.cause : undefined;
    toast.error(res.error.message, { description });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Tag className="h-4 w-4" />
              Update Tag
            </DialogTitle>
            <DialogDescription>
              {entry
                ? `${entry.description} · Bidder #${entry.bidder_number}`
                : null}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="tag">Tag</Label>
            <Select
              value={tag}
              onValueChange={(v) => setTag(v as CancelRefundTag)}
            >
              <SelectTrigger id="tag" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CANCEL_REFUND_TAG_VALUES.map((value) => (
                  <SelectItem key={value} value={value}>
                    {CANCEL_REFUND_TAG_LABELS[value]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || tag === entry?.tag}>
              {isLoading && <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />}
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
