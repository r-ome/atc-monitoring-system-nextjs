import { PrismaClient } from "@prisma/client";
import {
  inferCancelRefundTag,
  parseInventoryHistoryRemark,
} from "../../src/entities/models/InventoryHistoryRemark";

const prisma = new PrismaClient();

async function main() {
  const histories = await prisma.inventory_histories.findMany({
    where: {
      auction_status: { in: ["CANCELLED", "REFUNDED"] },
      deleted_at: null,
      tag: null,
    },
    select: { inventory_history_id: true, remarks: true, receipt_id: true },
  });

  console.log(`Found ${histories.length} histories to backfill...`);

  const receiptRemarks = new Map<string, string>();
  const receiptIds = histories
    .map((h) => h.receipt_id)
    .filter((id): id is string => Boolean(id));

  if (receiptIds.length) {
    const receipts = await prisma.receipt_records.findMany({
      where: { receipt_id: { in: receiptIds } },
      select: { receipt_id: true, remarks: true },
    });
    for (const r of receipts) {
      if (r.remarks) receiptRemarks.set(r.receipt_id, r.remarks);
    }
  }

  let updated = 0;
  const distribution: Record<string, number> = {};

  for (const h of histories) {
    const parsed = parseInventoryHistoryRemark(h.remarks);
    const receiptRemark = h.receipt_id ? receiptRemarks.get(h.receipt_id) : null;
    const reason = parsed.reason ?? receiptRemark ?? h.remarks ?? "";
    const tag = inferCancelRefundTag(reason);

    await prisma.inventory_histories.update({
      where: { inventory_history_id: h.inventory_history_id },
      data: { tag },
    });

    distribution[tag] = (distribution[tag] ?? 0) + 1;
    updated += 1;
  }

  console.log(`Updated ${updated} rows.`);
  console.log("Distribution:", distribution);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
