"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ColumnDef } from "@tanstack/react-table";
import { Loader2Icon, PencilIcon, Trash2Icon } from "lucide-react";
import { toast } from "sonner";
import { DataTable } from "@/app/components/data-table/data-table";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { DatePicker } from "@/app/components/ui/datepicker";
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
  createBidderRequirement,
  updateBidderRequirement,
  deleteBidderRequirement,
} from "@/app/(protected)/bidders/actions";

type RequirementRow = {
  requirement_id: string;
  name: string;
  url: string | null;
  validity_date: string | null;
};

interface BidderRequirementsTableProps {
  bidder_id: string;
  requirements: RequirementRow[];
}

const BidderRequirementsTable = ({
  bidder_id,
  requirements,
}: BidderRequirementsTableProps) => {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"create" | "edit">("create");
  const [selected, setSelected] = useState<RequirementRow | null>(null);
  const [validityDate, setValidityDate] = useState<Date | undefined>();
  const [isLoading, setIsLoading] = useState(false);

  const openCreate = () => {
    setMode("create");
    setSelected(null);
    setValidityDate(undefined);
    setOpen(true);
  };

  const openEdit = (req: RequirementRow) => {
    setMode("edit");
    setSelected(req);
    setValidityDate(req.validity_date ? new Date(req.validity_date) : undefined);
    setOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    const formData = new FormData(e.currentTarget);

    const res =
      mode === "create"
        ? await createBidderRequirement(bidder_id, formData)
        : await updateBidderRequirement(selected!.requirement_id, formData);

    setIsLoading(false);

    if (res.ok) {
      toast.success(
        mode === "create" ? "Requirement added!" : "Requirement updated!",
      );
      setOpen(false);
      router.refresh();
    } else {
      toast.error(res.error.message, {
        description:
          typeof res.error.cause === "string" ? res.error.cause : undefined,
      });
    }
  };

  const handleDelete = async (requirement_id: string) => {
    const res = await deleteBidderRequirement(requirement_id);
    if (res.ok) {
      toast.success("Requirement deleted!");
      router.refresh();
    } else {
      toast.error(res.error.message);
    }
  };

  const columns: ColumnDef<RequirementRow>[] = [
    {
      accessorKey: "name",
      header: "Name",
    },
    {
      accessorKey: "url",
      header: "URL",
      cell: ({ row }) =>
        row.original.url ? (
          <a
            href={row.original.url}
            target="_blank"
            rel="noreferrer"
            className="text-blue-500 underline truncate max-w-[200px] block"
          >
            {row.original.url}
          </a>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      accessorKey: "validity_date",
      header: "Validity Date",
      cell: ({ row }) =>
        row.original.validity_date ? (
          <span>{row.original.validity_date}</span>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <div className="flex gap-1 justify-end">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => openEdit(row.original)}
          >
            <PencilIcon className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleDelete(row.original.requirement_id)}
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
            <p className="font-semibold text-sm">Requirements</p>
            <Button size="sm" onClick={openCreate}>
              Add Requirement
            </Button>
          </div>
        }
        columns={columns}
        data={requirements}
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          key={`${mode}-${selected?.requirement_id ?? "new"}`}
        >
          <DialogHeader>
            <DialogTitle>
              {mode === "create" ? "Add Requirement" : "Edit Requirement"}
            </DialogTitle>
            <DialogDescription>
              {mode === "create"
                ? "Add a new requirement for this bidder."
                : "Update the requirement details."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex gap-4">
              <Label htmlFor="name" className="w-32">
                Name
              </Label>
              <Input
                name="name"
                defaultValue={selected?.name ?? ""}
                required
              />
            </div>
            <div className="flex gap-4">
              <Label htmlFor="url" className="w-32">
                URL
              </Label>
              <Input name="url" defaultValue={selected?.url ?? ""} />
            </div>
            <div className="flex gap-4">
              <Label className="w-32">Validity Date</Label>
              <DatePicker
                id="validity_date"
                name="validity_date"
                date={validityDate}
                onChange={setValidityDate}
              />
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2Icon className="animate-spin" />}
                Submit
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default BidderRequirementsTable;
