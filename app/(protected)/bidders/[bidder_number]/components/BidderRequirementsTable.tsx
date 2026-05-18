"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ColumnDef, Row } from "@tanstack/react-table";
import { FileText, Loader2Icon, PencilIcon, Trash2Icon } from "lucide-react";
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

  const renderMobileCard = (row: Row<RequirementRow>) => {
    const r = row.original;
    return (
      <div className="flex items-start gap-3 px-4 py-3">
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="text-[14px] font-semibold">{r.name}</span>
          {r.url ? (
            <a
              href={r.url}
              target="_blank"
              rel="noreferrer"
              className="truncate text-[12.5px] text-primary underline"
            >
              {r.url}
            </a>
          ) : null}
          {r.validity_date ? (
            <span className="text-[12px] text-muted-foreground">
              Valid until {r.validity_date}
            </span>
          ) : null}
        </div>
        <div className="flex shrink-0 gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              openEdit(r);
            }}
          >
            <PencilIcon className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(r.requirement_id);
            }}
          >
            <Trash2Icon className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      </div>
    );
  };

  return (
    <>
      <DataTable
        embedded={false}
        icon={FileText}
        title="Requirements"
        meta={`${requirements.length.toLocaleString()} entries`}
        rowLabel="requirement"
        columns={columns}
        data={requirements}
        renderMobileCard={renderMobileCard}
        actionButtons={
          <Button size="sm" onClick={openCreate}>
            Add Requirement
          </Button>
        }
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
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-4">
              <Label htmlFor="name" className="sm:w-32 sm:shrink-0">
                Name
              </Label>
              <Input
                name="name"
                defaultValue={selected?.name ?? ""}
                required
              />
            </div>
            <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-4">
              <Label htmlFor="url" className="sm:w-32 sm:shrink-0">
                URL
              </Label>
              <Input name="url" defaultValue={selected?.url ?? ""} />
            </div>
            <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-4">
              <Label className="sm:w-32 sm:shrink-0">Validity Date</Label>
              <div className="min-w-0 flex-1">
                <DatePicker
                  id="validity_date"
                  name="validity_date"
                  date={validityDate}
                  onChange={setValidityDate}
                />
              </div>
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
