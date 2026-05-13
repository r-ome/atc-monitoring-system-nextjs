import { formatDate } from "@/app/lib/utils";
import { NotFoundError } from "src/entities/errors/common";
import {
  FinalReportCandidate,
  FinalReportCounterCheckCandidate,
  FinalReportDecision,
  FinalReportDeductionItem,
  FinalReportInventoryRow,
  FinalReportMonitoringRow,
  FinalReportOptionsInput,
  FinalReportPreview,
} from "src/entities/models/FinalReport";
import { FinalReportDraft } from "src/entities/models/FinalReportDraft";
import { ATC_DEFAULT_BIDDER_NUMBER } from "src/entities/models/Bidder";
import { ContainerRepository, AuctionRepository } from "src/infrastructure/di/repositories";

const sameOptions = (
  a: { selected_dates: string[]; exclude_bidder_740: boolean; exclude_refunded_bidder_5013: boolean },
  b: { selected_dates: string[]; exclude_bidder_740: boolean; exclude_refunded_bidder_5013: boolean },
) => {
  if (a.exclude_bidder_740 !== b.exclude_bidder_740) return false;
  if (a.exclude_refunded_bidder_5013 !== b.exclude_refunded_bidder_5013) return false;
  if (a.selected_dates.length !== b.selected_dates.length) return false;
  const left = [...a.selected_dates].sort();
  const right = [...b.selected_dates].sort();
  return left.every((value, index) => value === right[index]);
};

const DATE_FORMAT = "MMM dd, yyyy";

const normalizeText = (value: string) =>
  value
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");

const isSameDescription = (a: string, b: string) =>
  normalizeText(a) === normalizeText(b);

const isSimilarDescription = (a: string, b: string) => {
  const left = normalizeText(a);
  const right = normalizeText(b);
  return left.length > 0 && right.length > 0 && (left.includes(right) || right.includes(left));
};

const isThreePartBarcode = (barcode: string) => barcode.split("-").length === 3;
const isTwoPartBarcode = (barcode: string) => barcode.split("-").length === 2;

const getContainerBarcode = (barcode: string) =>
  isThreePartBarcode(barcode) ? barcode.split("-").slice(0, 2).join("-") : barcode;

const toNumber = (value: string | number | null | undefined) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

type DraftPreviewState = {
  monitoring: FinalReportMonitoringRow[];
  unsoldItems: FinalReportInventoryRow[];
};

const getMergedControl = ({
  oldControl,
  newControl,
  controlChoice,
}: {
  oldControl: string | null | undefined;
  newControl: string | null | undefined;
  controlChoice?: "UNSOLD" | "SOLD";
}) => {
  const normalizedNewControl = newControl ?? "NC";
  if (
    normalizedNewControl === "0000" ||
    normalizedNewControl === "00NC" ||
    controlChoice === "SOLD"
  ) {
    return oldControl ?? "NC";
  }
  return normalizedNewControl;
};

const applyDraftToPreviewState = ({
  draft,
  rawUnsoldItems,
  rawMonitoring,
  inventoryMap,
}: {
  draft: FinalReportDraft | null;
  rawUnsoldItems: FinalReportInventoryRow[];
  rawMonitoring: FinalReportMonitoringRow[];
  inventoryMap: Map<string, { inventory_id: string; barcode: string; control: string | null; description: string }>;
}): DraftPreviewState => {
  if (!draft) {
    return { monitoring: rawMonitoring, unsoldItems: rawUnsoldItems };
  }

  // Collect inventory_ids resolved by the draft (so they leave the unsold list / candidate computations)
  const resolved = new Set<string>();
  for (const item of draft.bought_items) resolved.add(item.inventory_id);
  for (const merge of draft.merged_inventories) {
    resolved.add(merge.new_inventory_id);
  }
  for (const m of draft.matches) resolved.add(m.source_inventory_id);
  for (const ccm of draft.counter_check_matches) resolved.add(ccm.inventory_id);
  for (const split of draft.qty_splits) {
    for (const s of split.splits) resolved.add(s.target_inventory_id);
  }
  for (const addOn of draft.warehouse_add_ons) resolved.add(addOn.inventory_id);

  const unsoldItems = rawUnsoldItems.filter((item) => !resolved.has(item.inventory_id));

  // Start by applying manual merges staged from the UNSOLD overview: update the
  // selected two-part monitoring row to point at the selected three-part inventory.
  const mergeByOldInventoryId = new Map(
    draft.merged_inventories.map((merge) => [merge.old_inventory_id, merge]),
  );
  let monitoring: FinalReportMonitoringRow[] = rawMonitoring.map((row) => {
    const merge = mergeByOldInventoryId.get(row.inventory_id);
    if (!merge) return row;
    const target = inventoryMap.get(merge.new_inventory_id);
    if (!target) return row;
    return {
      ...row,
      inventory_id: target.inventory_id,
      barcode: target.barcode,
      control: getMergedControl({
        oldControl: row.control,
        newControl: target.control,
        controlChoice: merge.control_choice,
      }),
      status: "SOLD",
    };
  });

  // Apply matches: update each matched monitoring row to point at the 3-part inventory
  const matchByAuctionInventoryId = new Map(
    draft.matches.map((m) => [m.auction_inventory_id, m]),
  );
  monitoring = monitoring.map((row) => {
    const match = matchByAuctionInventoryId.get(row.auction_inventory_id);
    if (!match) return row;
    const source = inventoryMap.get(match.source_inventory_id);
    if (!source) return row;
    return {
      ...row,
      inventory_id: source.inventory_id,
      barcode: source.barcode,
      control: source.control ?? "NC",
      description: match.description,
      qty: match.qty,
      price: match.price,
    };
  });

  // Apply qty splits: reduce source row's qty/price, append synthetic rows for each split target
  const monitoringByAuctionInventoryId = new Map(
    monitoring.map((r, i) => [r.auction_inventory_id, i]),
  );
  const synthetic: FinalReportMonitoringRow[] = [];
  for (const split of draft.qty_splits) {
    const idx = monitoringByAuctionInventoryId.get(split.source_auction_inventory_id);
    if (idx === undefined) continue;
    const sourceRow = monitoring[idx];

    let remainingQty = Number(sourceRow.qty) || 0;
    let remainingPrice = sourceRow.price;
    for (const s of split.splits) {
      const target = inventoryMap.get(s.target_inventory_id);
      if (!target) continue;
      remainingQty -= Number(s.qty) || 0;
      remainingPrice -= s.price;
      synthetic.push({
        ...sourceRow,
        auction_inventory_id: `${sourceRow.auction_inventory_id}:split:${s.target_inventory_id}`,
        inventory_id: target.inventory_id,
        barcode: target.barcode,
        control: target.control ?? "NC",
        description: target.description,
        qty: s.qty,
        price: s.price,
        status: "SOLD",
      });
    }
    monitoring[idx] = {
      ...sourceRow,
      qty: String(Math.max(0, remainingQty)),
      price: Math.max(0, remainingPrice),
    };
  }

  // Append synthetic monitoring rows for BOUGHT decisions
  for (const item of draft.bought_items) {
    if (item.action !== "BOUGHT") continue;
    const inv = inventoryMap.get(item.inventory_id);
    if (!inv) continue;
    synthetic.push({
      auction_inventory_id: `draft-bought:${item.inventory_id}`,
      auction_bidder_id: item.auction_bidder_id,
      inventory_id: inv.inventory_id,
      auction_id: item.auction_id,
      barcode: inv.barcode,
      control: inv.control ?? "NC",
      description: inv.description,
      bidder_number: item.bidder_number,
      qty: item.qty,
      price: item.price,
      status: "BOUGHT_ITEM",
      auction_status: "UNPAID",
      manifest_number: "BOUGHT ITEM",
      auction_date: item.auction_date,
      was_bought_item: true,
      bought_item_price: item.price,
    });
  }

  // Append synthetic monitoring rows for counter-check matches
  for (const ccm of draft.counter_check_matches) {
    const inv = inventoryMap.get(ccm.inventory_id);
    if (!inv) continue;
    synthetic.push({
      auction_inventory_id: `draft-cc:${ccm.inventory_id}:${ccm.counter_check_id}`,
      auction_bidder_id: ccm.auction_bidder_id,
      inventory_id: inv.inventory_id,
      auction_id: ccm.auction_id,
      barcode: inv.barcode,
      control: inv.control ?? "NC",
      description: ccm.description,
      bidder_number: ccm.bidder_number,
      qty: ccm.qty,
      price: ccm.price,
      status: "SOLD",
      auction_status: "UNPAID",
      manifest_number: ccm.manifest_number,
      auction_date: ccm.auction_date,
      was_bought_item: false,
      bought_item_price: null,
    });
  }

  // Append synthetic monitoring rows for warehouse add-ons
  for (const addOn of draft.warehouse_add_ons) {
    const inv = inventoryMap.get(addOn.inventory_id);
    if (!inv) continue;
    synthetic.push({
      auction_inventory_id: `draft-addon:${addOn.inventory_id}`,
      auction_bidder_id: addOn.auction_bidder_id,
      inventory_id: inv.inventory_id,
      auction_id: addOn.auction_id,
      barcode: inv.barcode,
      control: inv.control ?? "NC",
      description: addOn.description,
      bidder_number: addOn.bidder_number,
      qty: addOn.qty,
      price: addOn.price,
      status: "SOLD",
      auction_status: "UNPAID",
      manifest_number: addOn.manifest_number,
      auction_date: addOn.auction_date,
      was_bought_item: false,
      bought_item_price: null,
    });
  }

  // Append synthetic monitoring rows for brand-new warehouse bought items
  for (let i = 0; i < draft.warehouse_bought_items.length; i++) {
    const wbi = draft.warehouse_bought_items[i];
    synthetic.push({
      auction_inventory_id: `draft-wbi:${i}`,
      auction_bidder_id: "",
      inventory_id: "",
      auction_id: "",
      barcode: wbi.barcode,
      control: wbi.control,
      description: wbi.description,
      bidder_number: ATC_DEFAULT_BIDDER_NUMBER,
      qty: "1",
      price: wbi.price,
      status: "BOUGHT_ITEM",
      auction_status: "UNPAID",
      manifest_number: "BOUGHT ITEM",
      auction_date: "",
      was_bought_item: true,
      bought_item_price: wbi.price,
    });
  }

  monitoring = [...monitoring, ...synthetic];

  return { monitoring, unsoldItems };
};

export const getFinalReportPreviewUseCase = async (
  input: FinalReportOptionsInput,
): Promise<FinalReportPreview> => {
  const container = await ContainerRepository.getContainerFinalReportData(input.barcode);

  if (!container) {
    throw new NotFoundError(`Container ${input.barcode} not found!`);
  }

  const draft = input.ignore_draft
    ? null
    : await ContainerRepository.getFinalReportDraft(container.container_id);

  const auctionDates = container.inventories.reduce<Record<string, number>>((acc, item) => {
    if (!item.auction_date || !item.auctions_inventory) return acc;
    const date = formatDate(item.auction_date, DATE_FORMAT);
    acc[date] = (acc[date] ?? 0) + 1;
    return acc;
  }, {});

  const toInventoryRow = (item: (typeof container.inventories)[number]): FinalReportInventoryRow => ({
    inventory_id: item.inventory_id,
    container_id: item.container_id,
    barcode: item.barcode,
    control: item.control ?? "NC",
    description: item.description,
    status: item.status,
    is_bought_item: item.is_bought_item ?? 0,
    auction_date: item.auction_date ? formatDate(item.auction_date, DATE_FORMAT) : "---",
    created_at: formatDate(item.created_at, DATE_FORMAT),
    updated_at: formatDate(item.updated_at, DATE_FORMAT),
    deleted_at: item.deleted_at ? formatDate(item.deleted_at, DATE_FORMAT) : null,
    container: { container_id: item.container_id, barcode: container.barcode },
    auctions_inventory: item.auctions_inventory
      ? {
          auction_inventory_id: item.auctions_inventory.auction_inventory_id,
          auction_bidder_id: item.auctions_inventory.auction_bidder_id,
          description: item.auctions_inventory.description,
          status: item.auctions_inventory.status,
          price: item.auctions_inventory.price,
          qty: item.auctions_inventory.qty,
          manifest_number: item.auctions_inventory.manifest_number,
          auction_date: formatDate(item.auctions_inventory.auction_date, DATE_FORMAT),
          reason:
            item.auctions_inventory.status === "CANCELLED" ||
            item.auctions_inventory.status === "REFUNDED"
              ? item.auctions_inventory.histories
                  .filter(
                    (history) =>
                      history.auction_status === item.auctions_inventory!.status &&
                      Boolean(history.remarks),
                  )
                  .sort(
                    (a, b) =>
                      new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
                  )[0]?.remarks ?? null
              : null,
          auction_bidder: {
            bidder_id: item.auctions_inventory.auction_bidder.bidder.bidder_id,
            bidder_number: item.auctions_inventory.auction_bidder.bidder.bidder_number,
            full_name: [
              item.auctions_inventory.auction_bidder.bidder.first_name,
              item.auctions_inventory.auction_bidder.bidder.middle_name,
              item.auctions_inventory.auction_bidder.bidder.last_name,
            ]
              .filter(Boolean)
              .join(" "),
          },
        }
      : null,
  });

  const selectedDatedAuctionInventories = container.inventories
    .filter((item) => item.auctions_inventory && item.auction_date)
    .filter((item) => input.selected_dates.includes(formatDate(item.auction_date!, DATE_FORMAT)))
    .filter((item) => item.auctions_inventory?.status !== "CANCELLED");

  const excludedBidder740DeductionItems: FinalReportDeductionItem[] =
    input.exclude_bidder_740
      ? selectedDatedAuctionInventories
          .filter(
            (item) =>
              item.auctions_inventory?.auction_bidder.bidder.bidder_number === "0740",
          )
          .map((item) => {
            const auctionInventory = item.auctions_inventory!;
            return {
              control: item.control ?? "NC",
              description: auctionInventory.description,
              bidder_number: auctionInventory.auction_bidder.bidder.bidder_number,
              original_price: auctionInventory.price,
              deducted_amount: auctionInventory.price,
            };
          })
      : [];

  const selectedAuctionInventories = selectedDatedAuctionInventories
    .filter((item) => {
      const auctionInventory = item.auctions_inventory;
      if (!auctionInventory) return false;

      if (
        input.exclude_refunded_bidder_5013 &&
        auctionInventory.status === "REFUNDED" &&
        auctionInventory.auction_bidder.bidder.bidder_number === ATC_DEFAULT_BIDDER_NUMBER
      ) {
        return false;
      }

      return !(input.exclude_bidder_740 && auctionInventory.auction_bidder.bidder.bidder_number === "0740");
    });

  const monitoringRows: FinalReportMonitoringRow[] = selectedAuctionInventories.map((item) => {
    const auctionInventory = item.auctions_inventory!;
    return {
      auction_inventory_id: auctionInventory.auction_inventory_id,
      auction_bidder_id: auctionInventory.auction_bidder_id,
      inventory_id: item.inventory_id,
      auction_id: auctionInventory.auction_bidder.auction_id,
      barcode: item.barcode,
      control: item.control ?? "NC",
      description: auctionInventory.description,
      bidder_number: auctionInventory.auction_bidder.bidder.bidder_number,
      qty: auctionInventory.qty,
      price: auctionInventory.price,
      status: item.status,
      auction_status: auctionInventory.status,
      manifest_number: auctionInventory.manifest_number,
      auction_date: formatDate(auctionInventory.auction_date, DATE_FORMAT),
      was_bought_item:
        item.histories.some((history) => history.inventory_status === "BOUGHT_ITEM") ||
        auctionInventory.histories.some((history) => history.inventory_status === "BOUGHT_ITEM"),
      bought_item_price: item.is_bought_item ?? 0,
    };
  });

  // Reduce source rows in-place when split-bought items reference them
  const splitReductionMap = new Map<string, number>();
  for (const item of selectedAuctionInventories) {
    const splitFromId = item.auctions_inventory?.split_from_auction_inventory_id;
    if (splitFromId) {
      splitReductionMap.set(splitFromId, (splitReductionMap.get(splitFromId) ?? 0) + item.auctions_inventory!.price);
    }
  }
  const monitoringRowsAfterSplits = splitReductionMap.size === 0
    ? monitoringRows
    : monitoringRows.map((row) => {
        const reduction = splitReductionMap.get(row.auction_inventory_id) ?? 0;
        return reduction > 0 ? { ...row, price: Math.max(0, row.price - reduction) } : row;
      });

  const auctionIds = [...new Set(monitoringRowsAfterSplits.map((item) => item.auction_id))];
  const counterChecksByAuction = new Map(
    await Promise.all(
      auctionIds.map(async (auctionId) => [
        auctionId,
        await AuctionRepository.getCounterCheckRecords(auctionId),
      ] as const),
    ),
  );

  const isRefundedBidder5013 = (item: (typeof container.inventories)[number]) =>
    item.auctions_inventory?.status === "REFUNDED" &&
    item.auctions_inventory.auction_bidder.bidder.bidder_number ===
      ATC_DEFAULT_BIDDER_NUMBER;

  const isRefundedReviewItem = (item: (typeof container.inventories)[number]) =>
    item.auctions_inventory?.status === "REFUNDED" &&
    !isRefundedBidder5013(item) &&
    Boolean(item.auction_date) &&
    input.selected_dates.includes(formatDate(item.auction_date!, DATE_FORMAT));

  const rawUnsoldItems = container.inventories
    .filter(
      (item) =>
        isThreePartBarcode(item.barcode) &&
        !isRefundedBidder5013(item) &&
        (item.status === "UNSOLD" || isRefundedReviewItem(item)),
    )
    .map(toInventoryRow);

  // Apply draft virtually: filter resolved inventories and synthesize monitoring rows
  // so the rest of the preview reflects staged-but-not-yet-committed decisions.
  const draftState = applyDraftToPreviewState({
    draft,
    rawUnsoldItems,
    rawMonitoring: monitoringRowsAfterSplits,
    inventoryMap: new Map(container.inventories.map((i) => [i.inventory_id, i])),
  });

  const unsoldItems = draftState.unsoldItems;
  const effectiveMonitoring = draftState.monitoring;

  const twoPartMonitoring = effectiveMonitoring.filter((item) => isTwoPartBarcode(item.barcode));
  const candidates: FinalReportCandidate[] = [];

  for (const unsoldItem of unsoldItems) {
    const isLinkedUnsold = unsoldItem.auctions_inventory !== null;
    for (const monitoringItem of twoPartMonitoring) {
      const sameContainer = getContainerBarcode(unsoldItem.barcode) === monitoringItem.barcode;
      const exactControl = unsoldItem.control === monitoringItem.control;
      const exactDescription = isSameDescription(unsoldItem.description, monitoringItem.description);
      const similarDescription = isSimilarDescription(unsoldItem.description, monitoringItem.description);
      const qty = toNumber(monitoringItem.qty);
      const counterChecks = (counterChecksByAuction.get(monitoringItem.auction_id) ?? []).filter(
        (item) =>
          item.control === unsoldItem.control &&
          (isSimilarDescription(item.description ?? "", unsoldItem.description) ||
            item.bidder_number === monitoringItem.bidder_number),
      );

      if (!sameContainer && !exactControl && !similarDescription && !counterChecks.length) {
        continue;
      }

      let confidence: FinalReportCandidate["confidence"] = "REVIEW";
      let score = 60;
      let reason = "Needs manual review";

      if (sameContainer && exactControl && exactDescription) {
        confidence = "AUTO";
        score = 100;
        reason = "Same container barcode, exact control, and exact description";
      } else if (sameContainer && exactControl) {
        score = 90;
        reason = "Same container barcode and exact control";
      } else if (exactControl && similarDescription) {
        score = 80;
        reason = "Exact control with similar description";
      } else if (qty > 1 && similarDescription) {
        confidence = "SPLIT";
        score = 70;
        reason = "Monitoring row has quantity greater than 1 and similar description";
      } else if (counterChecks.length) {
        score = 75;
        reason = "Counter-check has matching control evidence";
      }

      if (isLinkedUnsold) {
        if (qty > 1 && similarDescription) {
          confidence = "SPLIT";
          score = 70;
          reason =
            "Linked UNSOLD (cancelled/refunded) routed to split: monitoring qty > 1 with similar description";
        } else {
          continue;
        }
      }

      candidates.push({
        candidate_id: `${unsoldItem.inventory_id}:${monitoringItem.auction_inventory_id}`,
        confidence,
        reason,
        score,
        unsold_item: unsoldItem,
        monitoring_item: monitoringItem,
        counter_check_matches: counterChecks.map((item) => ({
          counter_check_id: item.counter_check_id,
          auction_id: monitoringItem.auction_id,
          control: item.control,
          bidder_number: item.bidder_number,
          price: item.price,
          page: item.page,
          description: item.description,
        })),
      });
    }
  }

  const usedMonitoringIds = new Set<string>();
  const autoResolved: FinalReportCandidate[] = [];

  for (const unsoldItem of unsoldItems) {
    const exactCandidates = candidates.filter(
      (item) => item.confidence === "AUTO" && item.unsold_item.inventory_id === unsoldItem.inventory_id,
    );
    if (exactCandidates.length !== 1) continue;

    const [candidate] = exactCandidates;
    if (usedMonitoringIds.has(candidate.monitoring_item.auction_inventory_id)) continue;

    usedMonitoringIds.add(candidate.monitoring_item.auction_inventory_id);
    autoResolved.push(candidate);
  }

  const autoResolvedInventoryIds = new Set(autoResolved.map((item) => item.unsold_item.inventory_id));
  const splitCandidates = candidates
    .filter((item) => item.confidence === "SPLIT" && !autoResolvedInventoryIds.has(item.unsold_item.inventory_id))
    .sort((a, b) => b.score - a.score);
  // Review-confidence candidates are no longer surfaced as a separate step;
  // those unsold items fall through to counter-check or warehouse, where the
  // user decides what to do with them.
  const matchedByTwoPartIds = new Set([
    ...autoResolvedInventoryIds,
    ...splitCandidates.map((item) => item.unsold_item.inventory_id),
  ]);

  const counterCheckCandidates: FinalReportCounterCheckCandidate[] = [];
  for (const unsoldItem of unsoldItems) {
    if (matchedByTwoPartIds.has(unsoldItem.inventory_id)) continue;

    const matches: FinalReportCounterCheckCandidate["matches"] = [];
    for (const [auctionId, records] of counterChecksByAuction.entries()) {
      for (const record of records) {
        if (!record.control || record.control !== unsoldItem.control) continue;
        if (
          !isSimilarDescription(
            record.description ?? "",
            unsoldItem.description,
          )
        ) {
          continue;
        }
        matches.push({
          counter_check_id: record.counter_check_id,
          auction_id: auctionId,
          control: record.control,
          bidder_number: record.bidder_number,
          price: record.price,
          page: record.page,
          description: record.description,
        });
      }
    }

    if (!matches.length) continue;

    counterCheckCandidates.push({
      candidate_id: `cc:${unsoldItem.inventory_id}`,
      reason: "Counter-check evidence (no matching 2-part monitoring row)",
      score: 70,
      unsold_item: unsoldItem,
      matches,
    });
  }

  const counterCheckInventoryIds = new Set(
    counterCheckCandidates.map((item) => item.unsold_item.inventory_id),
  );
  const candidateInventoryIds = new Set([
    ...matchedByTwoPartIds,
    ...counterCheckInventoryIds,
  ]);
  const warehouseCheckItems = unsoldItems.filter((item) => !candidateInventoryIds.has(item.inventory_id));

  const persistedTaxDeduction = await ContainerRepository.getContainerTaxDeduction(
    container.container_id,
  );
  const persistedTaxMatchesOptions =
    !!persistedTaxDeduction &&
    sameOptions(persistedTaxDeduction.options, {
      selected_dates: input.selected_dates,
      exclude_bidder_740: input.exclude_bidder_740,
      exclude_refunded_bidder_5013: input.exclude_refunded_bidder_5013,
    });

  const deductions: FinalReportDeductionItem[] = [
    ...excludedBidder740DeductionItems,
  ];
  let adjustedMonitoring = effectiveMonitoring;
  let taxDeductionPersisted = false;

  if (persistedTaxMatchesOptions && persistedTaxDeduction) {
    taxDeductionPersisted = true;
    const reductionByKey = new Map<string, number>();
    for (const item of persistedTaxDeduction.items) {
      deductions.push(item);
      const key = `${item.control}|${item.bidder_number}|${item.description}`;
      reductionByKey.set(
        key,
        (reductionByKey.get(key) ?? 0) + item.deducted_amount,
      );
    }
    adjustedMonitoring = effectiveMonitoring.map((item) => {
      const key = `${item.control}|${item.bidder_number}|${item.description}`;
      const reduction = reductionByKey.get(key);
      if (!reduction) return item;
      return { ...item, price: Math.max(0, item.price - reduction) };
    });
  } else {
    // Deductions come exclusively from the user's draft.tax_edits. The server
    // does not auto-compute the initial 30k deduction; the user configures
    // deductions manually in the Container Tax step.
    if (draft && draft.tax_edits.length > 0) {
      const editsByBarcodeControl = new Map(
        draft.tax_edits.map((e) => [`${e.barcode}|${e.control}`, e]),
      );
      adjustedMonitoring = effectiveMonitoring.map((item) => {
        const edit = editsByBarcodeControl.get(`${item.barcode}|${item.control}`);
        if (!edit || edit.deducted_amount <= 0) return item;
        const grossPrice =
          item.was_bought_item && item.bought_item_price != null
            ? item.bought_item_price
            : item.price;
        deductions.push({
          control: item.control,
          description: item.description,
          bidder_number: item.bidder_number,
          original_price: grossPrice,
          deducted_amount: edit.deducted_amount,
        });
        return { ...item, price: Math.max(0, item.price - edit.deducted_amount) };
      });
    }
  }

  const decisions: Record<string, FinalReportDecision> = {};
  for (const inventory of container.inventories) {
    if (inventory.status !== "UNSOLD" || !isThreePartBarcode(inventory.barcode)) {
      continue;
    }
    if (autoResolvedInventoryIds.has(inventory.inventory_id)) {
      decisions[inventory.inventory_id] = "MATCHED_2PART";
    } else if (
      splitCandidates.some((c) => c.unsold_item.inventory_id === inventory.inventory_id)
    ) {
      decisions[inventory.inventory_id] = "SPLIT_PENDING";
    } else if (counterCheckInventoryIds.has(inventory.inventory_id)) {
      decisions[inventory.inventory_id] = "COUNTER_CHECK_PENDING";
    } else {
      decisions[inventory.inventory_id] = "WAREHOUSE_PENDING";
    }
  }

  const bidderMap = new Map<string, {
    auction_bidder_id: string;
    auction_id: string;
    auction_date: string;
    bidder_number: string;
    full_name: string;
  }>();
  for (const item of selectedAuctionInventories) {
    const ai = item.auctions_inventory!;
    if (bidderMap.has(ai.auction_bidder_id)) continue;
    bidderMap.set(ai.auction_bidder_id, {
      auction_bidder_id: ai.auction_bidder_id,
      auction_id: ai.auction_bidder.auction_id,
      auction_date: formatDate(ai.auction_date, DATE_FORMAT),
      bidder_number: ai.auction_bidder.bidder.bidder_number,
      full_name: [
        ai.auction_bidder.bidder.first_name,
        ai.auction_bidder.bidder.middle_name,
        ai.auction_bidder.bidder.last_name,
      ]
        .filter(Boolean)
        .join(" "),
    });
  }
  const availableBidders = [...bidderMap.values()].sort((a, b) =>
    a.bidder_number.localeCompare(b.bidder_number),
  );

  return {
    options: input,
    sheet_details: {
      container_id: container.container_id,
      barcode: container.barcode,
      supplier: {
        supplier_id: container.supplier.supplier_id,
        name: container.supplier.name,
        sales_remittance_account: container.supplier.sales_remittance_account ?? "",
      },
    },
    auction_dates: auctionDates,
    unsold_items: unsoldItems,
    auto_resolved: autoResolved,
    split_candidates: splitCandidates,
    counter_check_candidates: counterCheckCandidates,
    warehouse_check_items: warehouseCheckItems,
    decisions,
    tax_deduction_persisted: taxDeductionPersisted,
    available_bidders: availableBidders,
    report: {
      monitoring: adjustedMonitoring,
      inventories: container.inventories.map(toInventoryRow),
      deductions,
    },
  };
};
