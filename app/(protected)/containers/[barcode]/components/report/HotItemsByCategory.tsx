"use client";

import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import {
  PencilIcon,
  PlusIcon,
  RefreshCwIcon,
  SearchIcon,
  SparklesIcon,
  Trash2Icon,
} from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import { Checkbox } from "@/app/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/app/components/ui/dialog";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { ScrollArea } from "@/app/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/app/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/app/components/ui/tooltip";
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
import {
  createContainerHotItemCategory,
  deleteContainerHotItemCategory,
  getContainerHotItemCategories,
  updateContainerHotItemCategory,
} from "../../../actions";
import type {
  ContainerHotItemAvailableDescription,
  ContainerHotItemCategoryReport,
  ContainerHotItemReport,
  ContainerHotItemSuggestedCategory,
} from "src/entities/models/ContainerHotItemCategory";

type CategoryFormState = {
  mode: "create" | "edit";
  category_id?: string;
  name: string;
  descriptions: string[];
};

type HotItemsByCategoryProps = {
  containerId: string;
  initialReport: ContainerHotItemReport;
};

function formatPeso(value: number): string {
  return value.toLocaleString("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function getStatusVariant(status: string | null) {
  if (status === "PAID") return "success";
  if (status === "UNPAID") return "warning";
  if (status === "CANCELLED" || status === "REFUNDED") return "destructive";
  return "secondary";
}

function getDescriptionKey(description: string) {
  return description.trim().replace(/\s+/g, " ").toUpperCase();
}

function CategoryItemsTooltip({
  name,
  items,
}: {
  name: string;
  items: ContainerHotItemCategoryReport["items"];
}) {
  const descriptions = Array.from(
    new Set(items.map((item) => item.description)),
  ).join(", ");

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="cursor-help underline decoration-dotted underline-offset-4">
          {name}
        </span>
      </TooltipTrigger>
      <TooltipContent
        side="right"
        className="max-h-96 max-w-none overflow-auto p-3 text-xs"
      >
        <div className="mb-2 border-b border-primary-foreground/30 pb-2 font-semibold">
          {name}
        </div>
        {descriptions ? (
          <div className="max-w-[24rem] whitespace-normal leading-relaxed">
            {descriptions}
          </div>
        ) : (
          <div>No included items.</div>
        )}
      </TooltipContent>
    </Tooltip>
  );
}

function getCategoryFormFromCategory(
  category: ContainerHotItemCategoryReport,
): CategoryFormState {
  return {
    mode: "edit",
    category_id: category.category_id,
    name: category.name,
    descriptions: category.descriptions,
  };
}

function getCategoryFormFromSuggestion(
  suggestion: ContainerHotItemSuggestedCategory,
): CategoryFormState {
  return {
    mode: "create",
    name: suggestion.name,
    descriptions: suggestion.descriptions,
  };
}

function CategoryDialog({
  containerId,
  form,
  availableDescriptions,
  open,
  onOpenChange,
  onSaved,
}: {
  containerId: string;
  form: CategoryFormState;
  availableDescriptions: ContainerHotItemAvailableDescription[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: (report: ContainerHotItemReport) => void;
}) {
  const [name, setName] = useState(form.name);
  const [query, setQuery] = useState("");
  const [selectedDescriptions, setSelectedDescriptions] = useState<Set<string>>(
    () => new Set(form.descriptions.map(getDescriptionKey)),
  );
  const [isPending, startTransition] = useTransition();

  const categoryId = form.category_id ?? null;
  const descriptionOptions = useMemo(() => {
    const normalizedQuery = getDescriptionKey(query);
    return availableDescriptions.filter((item) => {
      const belongsToCurrentCategory = item.category_id === categoryId;
      const unassigned = item.category_id === null;
      const matchesQuery =
        normalizedQuery.length === 0 ||
        item.normalized_description.includes(normalizedQuery);

      return (unassigned || belongsToCurrentCategory) && matchesQuery;
    });
  }, [availableDescriptions, categoryId, query]);

  const selectedDescriptionValues = useMemo(() => {
    const byNormalized = new Map(
      availableDescriptions.map((item) => [
        item.normalized_description,
        item.description,
      ]),
    );

    return Array.from(selectedDescriptions).flatMap((description) => {
      const value = byNormalized.get(description);
      return value ? [value] : [];
    });
  }, [availableDescriptions, selectedDescriptions]);

  const toggleDescription = (description: string) => {
    setSelectedDescriptions((current) => {
      const next = new Set(current);
      if (next.has(description)) {
        next.delete(description);
      } else {
        next.add(description);
      }
      return next;
    });
  };

  const save = () => {
    startTransition(async () => {
      const result =
        form.mode === "create"
          ? await createContainerHotItemCategory({
              container_id: containerId,
              name,
              descriptions: selectedDescriptionValues,
            })
          : await updateContainerHotItemCategory({
              category_id: form.category_id,
              name,
              descriptions: selectedDescriptionValues,
            });

      if (!result.ok) {
        toast.error(result.error.message);
        return;
      }

      const reportResult = await getContainerHotItemCategories({
        container_id: containerId,
      });

      if (!reportResult.ok) {
        toast.error(reportResult.error.message);
        return;
      }

      toast.success(
        form.mode === "create" ? "Category created" : "Category updated",
      );
      onSaved(reportResult.value);
      onOpenChange(false);
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>
            {form.mode === "create" ? "Create Category" : "Update Category"}
          </DialogTitle>
          <DialogDescription>
            Select inventory descriptions for this container category.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="hot-item-category-name">Name</Label>
            <Input
              id="hot-item-category-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="hot-item-description-search">Descriptions</Label>
            <div className="relative">
              <SearchIcon className="pointer-events-none absolute left-3 top-2.5 size-4 text-muted-foreground" />
              <Input
                id="hot-item-description-search"
                className="pl-9"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </div>
          </div>

          <ScrollArea className="h-80 rounded-md border">
            <div className="divide-y">
              {descriptionOptions.map((item) => {
                const checked = selectedDescriptions.has(
                  item.normalized_description,
                );

                return (
                  <label
                    key={item.normalized_description}
                    className="grid cursor-pointer grid-cols-[auto_1fr_auto] items-center gap-3 px-3 py-2 text-sm hover:bg-muted/60"
                  >
                    <Checkbox
                      checked={checked}
                      onCheckedChange={() =>
                        toggleDescription(item.normalized_description)
                      }
                    />
                    <span className="font-medium">{item.description}</span>
                    <span className="text-right tabular-nums text-muted-foreground">
                      {item.paid_items} paid / {formatPeso(item.total_paid_price)}
                    </span>
                  </label>
                );
              })}
              {descriptionOptions.length === 0 ? (
                <div className="px-3 py-8 text-center text-sm text-muted-foreground">
                  No descriptions available.
                </div>
              ) : null}
            </div>
          </ScrollArea>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={save}
            disabled={isPending || name.trim().length === 0}
          >
            {isPending ? (
              <RefreshCwIcon className="size-4 animate-spin" />
            ) : null}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function HotItemsByCategory({
  containerId,
  initialReport,
}: HotItemsByCategoryProps) {
  const [report, setReport] = useState(initialReport);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    initialReport.categories[0]?.category_id ?? null,
  );
  const [form, setForm] = useState<CategoryFormState | null>(null);
  const [deleteCategory, setDeleteCategory] =
    useState<ContainerHotItemCategoryReport | null>(null);
  const [isPending, startTransition] = useTransition();
  const hasSuggestions = report.suggested_categories.length > 0;

  const selectedCategory =
    report.categories.find(
      (category) => category.category_id === selectedCategoryId,
    ) ?? null;

  const toggleCategorySelection = (categoryId: string) => {
    setSelectedCategoryId((current) =>
      current === categoryId ? null : categoryId,
    );
  };

  const refresh = () => {
    startTransition(async () => {
      const result = await getContainerHotItemCategories({
        container_id: containerId,
      });

      if (!result.ok) {
        toast.error(result.error.message);
        return;
      }

      setReport(result.value);
      setSelectedCategoryId(
        (current) =>
          result.value.categories.find(
            (category) => category.category_id === current,
          )?.category_id ?? null,
      );
    });
  };

  const confirmDelete = () => {
    if (!deleteCategory) return;

    startTransition(async () => {
      const result = await deleteContainerHotItemCategory({
        category_id: deleteCategory.category_id,
      });

      if (!result.ok) {
        toast.error(result.error.message);
        return;
      }

      const reportResult = await getContainerHotItemCategories({
        container_id: containerId,
      });

      if (!reportResult.ok) {
        toast.error(reportResult.error.message);
        return;
      }

      toast.success("Category deleted");
      setReport(reportResult.value);
      setSelectedCategoryId(reportResult.value.categories[0]?.category_id ?? null);
      setDeleteCategory(null);
    });
  };

  const applySuggestion = (suggestion: ContainerHotItemSuggestedCategory) => {
    startTransition(async () => {
      const result = await createContainerHotItemCategory({
        container_id: containerId,
        name: suggestion.name,
        descriptions: suggestion.descriptions,
      });

      if (!result.ok) {
        toast.error(result.error.message);
        return;
      }

      const reportResult = await getContainerHotItemCategories({
        container_id: containerId,
      });

      if (!reportResult.ok) {
        toast.error(reportResult.error.message);
        return;
      }

      toast.success("Suggested category applied");
      setReport(reportResult.value);
      setSelectedCategoryId(
        reportResult.value.categories[0]?.category_id ?? null,
      );
    });
  };

  const applyAllSuggestions = () => {
    if (!hasSuggestions) return;

    startTransition(async () => {
      for (const suggestion of report.suggested_categories) {
        const result = await createContainerHotItemCategory({
          container_id: containerId,
          name: suggestion.name,
          descriptions: suggestion.descriptions,
        });

        if (!result.ok) {
          toast.error(result.error.message);
          return;
        }
      }

      const reportResult = await getContainerHotItemCategories({
        container_id: containerId,
      });

      if (!reportResult.ok) {
        toast.error(reportResult.error.message);
        return;
      }

      toast.success("Suggested categories applied");
      setReport(reportResult.value);
      setSelectedCategoryId(reportResult.value.categories[0]?.category_id ?? null);
      setShowSuggestions(false);
    });
  };

  return (
    <>
      <Card className="w-full">
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle>Hot Items by Category</CardTitle>
          <div className="flex gap-2">
            {hasSuggestions ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowSuggestions((current) => !current)}
              >
                <SparklesIcon className="size-4" />
                Suggestions
              </Button>
            ) : null}
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              onClick={refresh}
              disabled={isPending}
              title="Refresh"
            >
              <RefreshCwIcon
                className={isPending ? "size-4 animate-spin" : "size-4"}
              />
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() =>
                setForm({ mode: "create", name: "", descriptions: [] })
              }
            >
              <PlusIcon className="size-4" />
              Category
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {showSuggestions && hasSuggestions ? (
            <div className="overflow-hidden rounded-md border border-dashed">
              <div className="flex flex-col gap-2 border-b bg-muted/30 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <SparklesIcon className="size-4" />
                  Suggested Categories
                </div>
                <Button
                  type="button"
                  size="sm"
                  onClick={applyAllSuggestions}
                  disabled={isPending}
                >
                  {isPending ? (
                    <RefreshCwIcon className="size-4 animate-spin" />
                  ) : null}
                  Apply All
                </Button>
              </div>
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                  <TableRow>
                    <TableHead>Suggestion</TableHead>
                    <TableHead className="text-right">Descriptions</TableHead>
                    <TableHead className="text-right">Paid Items</TableHead>
                    <TableHead className="text-right">Paid Total</TableHead>
                    <TableHead className="w-24 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {report.suggested_categories.map((suggestion) => (
                    <TableRow key={suggestion.name}>
                      <TableCell className="font-medium">
                        <CategoryItemsTooltip
                          name={suggestion.name}
                          items={suggestion.items}
                        />
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {suggestion.descriptions.length}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {suggestion.paid_items}
                      </TableCell>
                      <TableCell className="text-right font-semibold tabular-nums text-green-600">
                        {formatPeso(suggestion.total_paid_price)}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            onClick={() =>
                              setForm(getCategoryFormFromSuggestion(suggestion))
                            }
                            title="Edit before applying"
                          >
                            <PencilIcon className="size-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => applySuggestion(suggestion)}
                            title="Apply"
                          >
                            <PlusIcon className="size-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                </Table>
              </div>
              <div className="flex flex-col gap-1.5 p-2 md:hidden">
                {report.suggested_categories.map((suggestion) => (
                  <div
                    key={suggestion.name}
                    className="rounded-md bg-secondary px-2.5 py-2"
                  >
                    <div className="flex items-start gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[13px] font-semibold">
                          <CategoryItemsTooltip
                            name={suggestion.name}
                            items={suggestion.items}
                          />
                        </div>
                        <div className="mt-0.5 text-[11px] text-muted-foreground">
                          {suggestion.descriptions.length} descriptions ·{" "}
                          {suggestion.paid_items} paid items
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono text-[13px] font-semibold text-green-600">
                          {formatPeso(suggestion.total_paid_price)}
                        </div>
                        <div className="mt-1 flex justify-end gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            onClick={() =>
                              setForm(getCategoryFormFromSuggestion(suggestion))
                            }
                            title="Edit before applying"
                          >
                            <PencilIcon className="size-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => applySuggestion(suggestion)}
                            title="Apply"
                          >
                            <PlusIcon className="size-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(22rem,0.9fr)]">
            <div className="overflow-hidden rounded-md border">
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
	                      <TableHead>Category</TableHead>
	                      <TableHead className="text-right">Descriptions</TableHead>
	                      <TableHead className="text-right">Paid Total</TableHead>
	                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {report.categories.map((category) => (
                      <TableRow
                        key={category.category_id}
                        className="cursor-pointer"
                        data-state={
                          selectedCategory?.category_id === category.category_id
                            ? "selected"
                            : undefined
                        }
                        onClick={() => toggleCategorySelection(category.category_id)}
                      >
                        <TableCell className="font-medium">
                          <CategoryItemsTooltip
                            name={category.name}
                            items={category.items}
                          />
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {category.descriptions.length}
                        </TableCell>
	                        <TableCell className="text-right font-semibold tabular-nums text-green-600">
	                          {formatPeso(category.total_paid_price)}
	                        </TableCell>
	                      </TableRow>
                    ))}
                    {report.categories.length === 0 ? (
                      <TableRow>
	                        <TableCell
	                          colSpan={4}
	                          className="py-8 text-center text-muted-foreground"
                        >
                          No categories yet.
                        </TableCell>
                      </TableRow>
                    ) : null}
                  </TableBody>
                </Table>
              </div>
              <div className="flex flex-col gap-1.5 p-2 md:hidden">
                {report.categories.map((category) => (
                  <div
                      key={category.category_id}
                    className={`cursor-pointer rounded-md bg-secondary px-2.5 py-2 hover:bg-secondary/70 ${
                        selectedCategory?.category_id === category.category_id
                        ? "ring-1 ring-primary"
                        : ""
                    }`}
                      onClick={() => toggleCategorySelection(category.category_id)}
                    >
                    <div className="flex items-start gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[13px] font-semibold">
                        <CategoryItemsTooltip
                          name={category.name}
                          items={category.items}
                        />
                        </div>
                        <div className="mt-0.5 text-[11px] text-muted-foreground">
	                          {category.descriptions.length} descriptions
	                        </div>
                      </div>
	                      <div className="font-mono text-[13px] font-semibold text-green-600">
	                        {formatPeso(category.total_paid_price)}
	                      </div>
                    </div>
                  </div>
                ))}
                {report.categories.length === 0 ? (
                  <div className="py-8 text-center text-sm text-muted-foreground">
                    No categories yet.
                  </div>
                ) : null}
              </div>
            </div>

            {selectedCategory ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-sm font-semibold">
                    {selectedCategory.name}
                  </h3>
                  <div className="flex gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      onClick={() =>
                        setForm(getCategoryFormFromCategory(selectedCategory))
                      }
                      title="Edit"
                    >
                      <PencilIcon className="size-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => setDeleteCategory(selectedCategory)}
                      title="Delete"
                    >
                      <Trash2Icon className="size-4" />
                    </Button>
                  </div>
                </div>
                <div className="overflow-hidden rounded-md border">
                  <ScrollArea className="h-[28rem]">
                    <div className="hidden md:block">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="sticky top-0 z-10 bg-background">
                              Barcode
                            </TableHead>
                            <TableHead className="sticky top-0 z-10 bg-background">
                              Control
                            </TableHead>
                            <TableHead className="sticky top-0 z-10 bg-background">
                              Description
                            </TableHead>
                            <TableHead className="sticky top-0 z-10 bg-background text-right">
                              Price
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {selectedCategory.items.map((item) => (
                            <TableRow key={item.inventory_id}>
                              <TableCell className="font-medium">
                                {item.barcode}
                              </TableCell>
                              <TableCell>{item.control}</TableCell>
                              <TableCell>{item.description}</TableCell>
                              <TableCell className="text-right tabular-nums">
                                {formatPeso(item.price)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                    <div className="flex flex-col gap-1.5 p-2 md:hidden">
                      {selectedCategory.items.map((item) => (
                        <div
                          key={item.inventory_id}
                          className="rounded-md bg-secondary px-2.5 py-2"
                        >
                          <div className="flex items-start gap-2">
                            <div className="min-w-0 flex-1">
                              <div className="font-mono text-[12px] font-semibold">
                                {item.barcode}
                              </div>
                              <div className="mt-0.5 truncate text-[12px] text-muted-foreground">
                                {item.control} · {item.description}
                              </div>
                            </div>
                            <div className="flex shrink-0 flex-col items-end gap-1">
                              <span className="font-mono text-[13px] font-semibold">
                                {formatPeso(item.price)}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              </div>
            ) : (
              <div className="flex min-h-[12rem] items-center justify-center rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
                Tap or click a category to see the items included in it. Tap the
                same category again to hide the list.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {form ? (
        <CategoryDialog
          key={`${form.mode}-${form.category_id ?? (form.name || "new")}`}
          containerId={containerId}
          form={form}
          availableDescriptions={report.available_descriptions}
          open={Boolean(form)}
          onOpenChange={(open) => {
            if (!open) setForm(null);
          }}
          onSaved={(nextReport) => {
            setReport(nextReport);
            setSelectedCategoryId(
              form.category_id ??
                nextReport.categories[0]?.category_id ??
                null,
            );
          }}
        />
      ) : null}

      <AlertDialog
        open={Boolean(deleteCategory)}
        onOpenChange={(open) => {
          if (!open) setDeleteCategory(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Category</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the category and its selected descriptions from this
              container.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} disabled={isPending}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
