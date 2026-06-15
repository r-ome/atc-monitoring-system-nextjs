"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ColumnDef, Row } from "@tanstack/react-table";
import { Ban, Loader2Icon, Trash2Icon, UserCheck } from "lucide-react";
import { toast } from "sonner";
import type { BidderStatus } from "src/entities/models/Bidder";
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
  updateBidderStatus,
} from "@/app/(protected)/bidders/actions";

type BanHistoryRow = {
  bidder_ban_history_id: string;
  remarks: string;
  created_at: string;
};

interface BidderBanHistoriesTableProps {
  bidder_id: string;
  bidder_status: BidderStatus;
  ban_histories: BanHistoryRow[];
}

type DialogMode = "ban" | "unban";

const BidderBanHistoriesTable = ({
  bidder_id,
  bidder_status,
  ban_histories,
}: BidderBanHistoriesTableProps) => {
  const router = useRouter();
  const [dialogMode, setDialogMode] = useState<DialogMode | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const isBanned = bidder_status === "BANNED";

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    const formData = new FormData(e.currentTarget);

    const res = await createBanHistory(bidder_id, formData);
    setIsLoading(false);

    if (res.ok) {
      toast.success("Bidder banned and history recorded!");
      setDialogMode(null);
      router.refresh();
    } else {
      toast.error(res.error.message, {
        description:
          typeof res.error.cause === "string" ? res.error.cause : undefined,
      });
    }
  };

  const handleUnban = async () => {
    setIsLoading(true);
    const res = await updateBidderStatus(bidder_id, "ACTIVE");
    setIsLoading(false);

    if (res.ok) {
      toast.success("Bidder unbanned!");
      setDialogMode(null);
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

  const renderMobileCard = (row: Row<BanHistoryRow>) => {
    const r = row.original;
    return (
      <div className="flex items-start gap-3 px-4 py-3">
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="text-[12.5px] font-medium text-muted-foreground">
            {r.created_at}
          </span>
          <span className="text-[14px] text-foreground">{r.remarks}</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="shrink-0"
          onClick={(e) => {
            e.stopPropagation();
            handleDelete(r.bidder_ban_history_id);
          }}
        >
          <Trash2Icon className="h-4 w-4 text-destructive" />
        </Button>
      </div>
    );
  };

  return (
    <>
      <DataTable
        embedded={false}
        icon={Ban}
        title="Ban History"
        meta={`${ban_histories.length.toLocaleString()} entries`}
        rowLabel="entry"
        columns={columns}
        data={ban_histories}
        renderMobileCard={renderMobileCard}
        actionButtons={
          <Button
            size="sm"
            variant={isBanned ? "default" : "destructive"}
            onClick={() => setDialogMode(isBanned ? "unban" : "ban")}
          >
            {isBanned ? (
              <>
                <UserCheck className="h-4 w-4" />
                Unban Bidder
              </>
            ) : (
              "Ban Bidder"
            )}
          </Button>
        }
      />

      <Dialog
        open={dialogMode !== null}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) setDialogMode(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            {dialogMode === "unban" ? (
              <>
                <DialogTitle>Unban Bidder</DialogTitle>
                <DialogDescription>
                  This will set the bidder status back to ACTIVE. Existing ban
                  history entries will be kept.
                </DialogDescription>
              </>
            ) : (
              <>
                <DialogTitle>Ban Bidder</DialogTitle>
                <DialogDescription>
                  This will set the bidder status to BANNED and record the
                  reason.
                </DialogDescription>
              </>
            )}
          </DialogHeader>
          {dialogMode === "unban" ? (
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </DialogClose>
              <Button type="button" onClick={handleUnban} disabled={isLoading}>
                {isLoading && <Loader2Icon className="animate-spin" />}
                Confirm Unban
              </Button>
            </DialogFooter>
          ) : (
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
                <Button
                  type="submit"
                  variant="destructive"
                  disabled={isLoading}
                >
                  {isLoading && <Loader2Icon className="animate-spin" />}
                  Confirm Ban
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default BidderBanHistoriesTable;
