"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ColumnDef } from "@tanstack/react-table";
import { Loader2Icon, Trash2Icon } from "lucide-react";
import { toast } from "sonner";
import { DataTable } from "@/app/components/data-table/data-table";
import { Button } from "@/app/components/ui/button";
import { Label } from "@/app/components/ui/label";
import { Textarea } from "@/app/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/app/components/ui/dialog";
import {
  createBanHistory,
  deleteBanHistory,
} from "@/app/(protected)/bidders/actions";

type BanHistoryRow = {
  bidder_ban_history_id: string;
  remarks: string;
  created_at: string;
};

interface BidderBanHistoriesTableProps {
  bidder_id: string;
  ban_histories: BanHistoryRow[];
}

const BidderBanHistoriesTable = ({
  bidder_id,
  ban_histories,
}: BidderBanHistoriesTableProps) => {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    const formData = new FormData(e.currentTarget);

    const res = await createBanHistory(bidder_id, formData);
    setIsLoading(false);

    if (res.ok) {
      toast.success("Bidder banned and history recorded!");
      setOpen(false);
      router.refresh();
    } else {
      toast.error(res.error.message, {
        description:
          typeof res.error.cause === "string" ? res.error.cause : undefined,
      });
    }
  };

  const handleDelete = async (bidder_ban_history_id: string) => {
    const res = await deleteBanHistory(bidder_ban_history_id);
    if (res.ok) {
      toast.success("Ban history entry deleted!");
      router.refresh();
    } else {
      toast.error(res.error.message);
    }
  };

  const columns: ColumnDef<BanHistoryRow>[] = [
    {
      accessorKey: "created_at",
      header: "Banned At",
      size: 140,
    },
    {
      accessorKey: "remarks",
      header: "Remarks",
    },
    {
      id: "actions",
      header: "",
      size: 60,
      cell: ({ row }) => (
        <div className="flex justify-end">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleDelete(row.original.bidder_ban_history_id)}
          >
            <Trash2Icon className="w-4 h-4 text-destructive" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <>
      <DataTable
        title={
          <div className="flex items-center justify-between mb-2">
            <p className="font-semibold text-sm">Ban History</p>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => setOpen(true)}
            >
              Ban Bidder
            </Button>
          </div>
        }
        columns={columns}
        data={ban_histories}
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ban Bidder</DialogTitle>
            <DialogDescription>
              This will set the bidder status to BANNED and record the reason.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="remarks">Reason / Remarks</Label>
              <Textarea
                name="remarks"
                placeholder="Enter the reason for banning this bidder..."
                required
                rows={4}
              />
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit" variant="destructive" disabled={isLoading}>
                {isLoading && <Loader2Icon className="animate-spin" />}
                Confirm Ban
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default BidderBanHistoriesTable;
