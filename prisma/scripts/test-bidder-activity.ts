import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

/** Optional integration suite. Never falls back to the application's DATABASE_URL. */
async function main() {
  const destination = process.env.BIDDER_ACTIVITY_TEST_DATABASE_URL;
  if (!destination) throw new Error("Set BIDDER_ACTIVITY_TEST_DATABASE_URL to a dedicated local MySQL test database.");
  const url = new URL(destination);
  const database = url.pathname.slice(1);
  if (url.protocol !== "mysql:" || !["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)
    || !/^atc_bidder_activity_test(?:_[a-z0-9]+)?$/.test(database)) {
    throw new Error("Use a local database named atc_bidder_activity_test or atc_bidder_activity_test_SUFFIX.");
  }
  process.env.DATABASE_URL = destination;

  // Import the real repositories only after selecting the isolated database.
  const { PrismaClient } = await import("@prisma/client");
  const { default: prisma } = await import("../../app/lib/prisma/prisma");
  const { RequestContext } = await import("../../app/lib/prisma/RequestContext");
  const { SUPER_ADMIN_BRANCH } = await import("../../app/lib/prisma/prisma");
  const { BidderRepository } = await import("../../src/infrastructure/repositories/bidders.repository");
  const { BidderRequirementRepository } = await import("../../src/infrastructure/repositories/bidder-requirement.repository");
  const { BidderBanHistoryRepository } = await import("../../src/infrastructure/repositories/bidder-ban-history.repository");
  const { AuctionRepository } = await import("../../src/infrastructure/repositories/auctions.repository");
  const { InventoryRepository } = await import("../../src/infrastructure/repositories/inventories.repository");
  const { PaymentRepository } = await import("../../src/infrastructure/repositories/payments.repository");
  const { ReportsRepository } = await import("../../src/infrastructure/repositories/reports.repository");
  const { ContainerRepository } = await import("../../src/infrastructure/repositories/containers.repository");
  const { withBidderActivity, touchBidderActivity, recalculateBidderActivity } = await import("../../src/infrastructure/repositories/bidder-activity");
  const { initializeBidderActivity } = await import("../../src/infrastructure/repositories/bidder-activity-initialization");
  const { createBidderSchema, updateBidderSchema } = await import("../../src/entities/models/Bidder");
  const { getBidderActivityCutoff, getBidderActivityTime } = await import("../../src/entities/models/BidderActivity");
  const { buildCancelledHistoryRemark } = await import("../../src/entities/models/InventoryHistoryRemark");
  const direct = new PrismaClient({ datasources: { db: { url: destination } } });
  const writer = new PrismaClient({ datasources: { db: { url: destination } } });
  const prefix = `activity-${randomUUID()}`;
  const branchA = `${prefix}-a`, branchB = `${prefix}-b`;
  const branchIds = [branchA, branchB];
  const old = new Date("2020-01-01T00:00:00Z");
  const now = getBidderActivityTime();
  const previousFlag = process.env.BIDDER_ACTIVITY_RECALCULATION_ENABLED;
  const run = <T>(work: () => Promise<T>) => RequestContext.run({ branch_id: branchA, username: "integration", branch_name: "Synthetic A" }, work);
  const row = (id: string) => direct.bidders.findUniqueOrThrow({ where: { bidder_id: id } });
  const reset = (id: string) => direct.bidders.update({ where: { bidder_id: id }, data: { status: "INACTIVE", last_activity_at: old } });
  const assertActive = async (id: string) => {
    const bidder = await row(id);
    assert.equal(bidder.status, "ACTIVE");
    assert.ok(bidder.last_activity_at && bidder.last_activity_at >= now);
  };

  try {
    const target = await direct.$queryRaw<{ name: string }[]>`SELECT DATABASE() AS name`;
    assert.equal(target[0].name, database);
    await direct.branches.createMany({ data: branchIds.map((branch_id) => ({ branch_id, name: "Synthetic activity test" })) });
    const staleId = `${prefix}-stale`, recentId = `${prefix}-recent`, bannedId = `${prefix}-banned`, missingId = `${prefix}-missing`, otherId = `${prefix}-other`;
    await direct.bidders.createMany({ data: [
      { bidder_id: staleId, branch_id: branchA, bidder_number: "0001", status: "ACTIVE" as const, last_activity_at: old },
      { bidder_id: recentId, branch_id: branchA, bidder_number: "0002", status: "INACTIVE" as const, last_activity_at: now },
      { bidder_id: bannedId, branch_id: branchA, bidder_number: "0003", status: "BANNED" as const, last_activity_at: old },
      { bidder_id: missingId, branch_id: branchA, bidder_number: "0004", status: "ACTIVE" as const, last_activity_at: null },
      { bidder_id: otherId, branch_id: branchB, bidder_number: "0001", status: "ACTIVE" as const, last_activity_at: old },
      ...branchIds.map((branch_id) => ({ bidder_id: `${branch_id}-atc`, branch_id, bidder_number: "5013", status: "ACTIVE" as const, last_activity_at: null })),
    ].map((data) => ({ ...data, first_name: "Synthetic", last_name: "Bidder", created_at: old, updated_at: old })) });

    process.env.BIDDER_ACTIVITY_RECALCULATION_ENABLED = "false";
    const initial = await run(() => AuctionRepository.startAuction(old, branchA));
    assert.equal(initial.bidder_activity, null);
    process.env.BIDDER_ACTIVITY_RECALCULATION_ENABLED = "true";
    const beforeCount = await direct.auctions.count({ where: { branch_id: branchA } });
    await assert.rejects(run(() => AuctionRepository.startAuction(old, branchA)), /activity records need review/);
    assert.equal(await direct.auctions.count({ where: { branch_id: branchA } }), beforeCount);
    console.log("PASS: default rollout preserves startup; readiness failure rolls back auction creation");

    const options = { branch_id: branchA, all_branches: false, apply: false, batch_size: 2 };
    const preview = await initializeBidderActivity(direct, options, now);
    assert.equal(preview[0].needs_initialization, 1);
    assert.equal((await row(missingId)).last_activity_at, null);
    await initializeBidderActivity(direct, { ...options, apply: true }, now);
    assert.equal((await row(missingId)).last_activity_at?.toISOString(), old.toISOString());
    const startedAt = performance.now();
    const started = await RequestContext.run({ branch_id: SUPER_ADMIN_BRANCH }, () => AuctionRepository.startAuction(old, branchA));
    console.log(`Isolated startup duration: ${(performance.now() - startedAt).toFixed(1)} ms (synthetic data only)`);
    assert.ok(started.bidder_activity);
    assert.equal(started.bidder_activity.activated, 1);
    assert.equal(started.bidder_activity.deactivated, 2);
    assert.equal((await row(staleId)).status, "INACTIVE");
    assert.equal((await row(recentId)).status, "ACTIVE");
    assert.equal((await row(bannedId)).status, "BANNED");
    assert.equal((await row(otherId)).status, "ACTIVE");
    assert.equal((await row(`${branchA}-atc`)).last_activity_at, null);
    console.log("PASS: six-month recalculation isolates branches, preserves bans and ATC, and uses actual time for backdated auctions");

    const created = await run(() => BidderRepository.createBidder(createBidderSchema.parse({
      bidder_number: "10010", first_name: "Synthetic", last_name: "Created", branch_id: branchA,
      status: "ACTIVE", registration_fee: 0, service_charge: 0, payment_term: 7,
    })));
    await assertActive(created.bidder_id);
    await reset(created.bidder_id);
    await run(() => BidderRepository.updateBidder(created.bidder_id, updateBidderSchema.parse({ ...created, payment_term: 7, branch_id: branchA })));
    await assertActive(created.bidder_id);
    await reset(created.bidder_id);
    const requirement = await run(() => BidderRequirementRepository.create(created.bidder_id, { name: "Synthetic requirement" }));
    await assertActive(created.bidder_id);
    await reset(created.bidder_id);
    await run(() => BidderRequirementRepository.delete(requirement.requirement_id));
    await assertActive(created.bidder_id);
    assert.equal(await direct.bidder_requirements.count({ where: { requirement_id: requirement.requirement_id } }), 0);
    await run(() => BidderBanHistoryRepository.create(created.bidder_id, { remarks: "Synthetic test ban" }));
    await run(() => BidderRequirementRepository.create(created.bidder_id, { name: "Banned bidder requirement" }));
    assert.equal((await row(created.bidder_id)).status, "BANNED");
    await run(() => BidderRepository.updateBidderStatus(created.bidder_id, "ACTIVE"));
    await assertActive(created.bidder_id);
    console.log("PASS: creation, profile edits, requirement creation/deletion, ban precedence, and explicit unban persist activity");

    const method = await direct.payment_methods.create({ data: { payment_method_id: `${prefix}-method`, name: "Synthetic" } });
    await reset(created.bidder_id);
    const registration = await run(() => AuctionRepository.registerBidder({
      bidder_id: created.bidder_id, auction_id: started.auction.auction_id, registration_fee: 0,
      service_charge: 0, balance: 0, payments: [{ payment_method: method.payment_method_id, amount_paid: 0 }],
    }));
    await assertActive(created.bidder_id);
    const receipt = await direct.receipt_records.findFirstOrThrow({ where: { auction_bidder_id: registration.auction_bidder_id } });
    const payment = await direct.payments.findFirstOrThrow({ where: { receipt_id: receipt.receipt_id } });
    await reset(created.bidder_id);
    await run(() => PaymentRepository.updatePaymentMethod(payment.payment_id, { payment_method: method.payment_method_id }));
    await assertActive(created.bidder_id);
    await reset(created.bidder_id);
    await run(() => PaymentRepository.addStorageFee({ parent_receipt_id: receipt.receipt_id, payment_method_id: method.payment_method_id, amount: 1 }));
    await assertActive(created.bidder_id);
    console.log("PASS: registration, payment corrections, and storage fees reactivate the correct bidder");

    const supplier = await direct.suppliers.create({ data: { supplier_id: `${prefix}-supplier`, supplier_code: prefix, name: "Synthetic" } });
    const container = await direct.containers.create({ data: { container_id: `${prefix}-container`, barcode: prefix, supplier_id: supplier.supplier_id, branch_id: branchA } });
    const inventory = await direct.inventories.create({ data: { inventory_id: `${prefix}-inventory`, barcode: `${prefix}-001`, control: "0001", description: "Synthetic", container_id: container.container_id } });
    const item = await direct.auctions_inventories.create({ data: {
      auction_inventory_id: `${prefix}-item`, inventory_id: inventory.inventory_id, auction_bidder_id: registration.auction_bidder_id,
      description: "Synthetic", price: 10, qty: "1", manifest_number: "SYNTHETIC", auction_date: old,
    } });
    await reset(created.bidder_id);
    await run(() => InventoryRepository.updateInventory(inventory.inventory_id, { container_id: container.container_id, barcode: inventory.barcode, control: "0001", description: "Changed synthetic" }));
    await assertActive(created.bidder_id);

    const secondRegistration = await run(() => AuctionRepository.registerBidder({
      bidder_id: recentId, auction_id: started.auction.auction_id, registration_fee: 0, service_charge: 0, balance: 0,
      payments: [{ payment_method: method.payment_method_id, amount_paid: 0 }],
    }));
    await reset(created.bidder_id);
    await run(() => AuctionRepository.uploadCounterCheck(started.auction.auction_id, [{
      CONTROL: "0001", BIDDER: "10010", PRICE: "10", PAGE: "1", DESCRIPTION: "Synthetic", TIME: "12:00",
    }]));
    await assertActive(created.bidder_id);
    const counter = await direct.counter_check.findFirstOrThrow({ where: { auction_id: started.auction.auction_id } });
    await reset(created.bidder_id); await reset(recentId);
    await run(() => AuctionRepository.updateCounterCheck(counter.counter_check_id, {
      control: "0001", bidder_number: "0002", price: "10", page: "1", time: "12:00", description: "Synthetic",
    }));
    await assertActive(created.bidder_id); await assertActive(recentId);
    console.log("PASS: counter-check uploads and corrections identify both bidders through the auction");
    await reset(created.bidder_id); await reset(recentId);
    await run(() => InventoryRepository.updateAuctionItem({
      auction_id: started.auction.auction_id, auction_inventory_id: item.auction_inventory_id,
      inventory_id: inventory.inventory_id, bidder_number: "0002", barcode: inventory.barcode,
      control: "0001", description: "Reassigned synthetic", price: 10, qty: "1", manifest_number: "SYNTHETIC",
    }));
    assert.equal((await direct.auctions_inventories.findUniqueOrThrow({ where: { auction_inventory_id: item.auction_inventory_id } })).auction_bidder_id, secondRegistration.auction_bidder_id);
    await assertActive(created.bidder_id); await assertActive(recentId);
    console.log("PASS: inventory edits and reassignment record activity for both affected bidders");

    await reset(recentId);
    await run(() => ContainerRepository.updateContainerStatus(container.container_id, "2026-10-17"));
    await assertActive(recentId);
    console.log("PASS: container financial edits record activity for associated bidders");

    await run(async () => BidderRepository.updateBidder(recentId,
      updateBidderSchema.parse({ ...await row(recentId), branch_id: branchB })));
    await reset(recentId);
    await run(() => InventoryRepository.updateInventory(inventory.inventory_id, { container_id: container.container_id, barcode: inventory.barcode, control: "0001", description: "Authorized container edit" }));
    await assertActive(recentId);
    await assert.rejects(run(() => BidderRepository.updateBidderStatus(recentId, "ACTIVE")), /not found in this branch/);
    await direct.bidders.update({ where: { bidder_id: recentId }, data: { branch_id: branchA } });
    console.log("PASS: authorized item edits track transferred bidders while direct foreign-branch edits remain blocked");

    const atcRegistration = await direct.auctions_bidders.findFirstOrThrow({ where: { auction_id: started.auction.auction_id, bidder: { bidder_number: "5013" } } });
    await direct.auctions_inventories.update({ where: { auction_inventory_id: item.auction_inventory_id }, data: { auction_bidder_id: atcRegistration.auction_bidder_id, status: "CANCELLED" } });
    await direct.inventory_histories.create({ data: {
      inventory_id: inventory.inventory_id, auction_inventory_id: item.auction_inventory_id,
      auction_status: "CANCELLED", inventory_status: "UNSOLD",
      remarks: buildCancelledHistoryRemark({ bidder_number: "0002", bidder_name: "Synthetic Bidder" }, "Synthetic"),
    } });
    await reset(recentId);
    await run(() => ReportsRepository.updateRefundCancellationTag(item.auction_inventory_id, "OTHER"));
    await assertActive(recentId);
    console.log("PASS: cancellation tag edits track the original bidder after ownership moves to ATC");

    await reset(created.bidder_id);
    await assert.rejects(run(() => withBidderActivity(prisma, { bidderIds: [created.bidder_id] }, async () => { throw new Error("synthetic rollback"); })), /synthetic rollback/);
    assert.equal((await row(created.bidder_id)).last_activity_at?.toISOString(), old.toISOString());
    assert.equal((await row(created.bidder_id)).status, "INACTIVE");

    await direct.bidders.update({ where: { bidder_id: staleId }, data: { status: "ACTIVE", last_activity_at: old } });
    await run(() => prisma.$transaction(async (tx) => {
      await tx.bidders.findFirst({ where: { bidder_id: staleId } });
      await writer.$transaction((other) => touchBidderActivity(other, [staleId], now));
      await recalculateBidderActivity(tx, branchA, new Date());
    }));
    await assertActive(staleId);
    console.log("PASS: failed business writes roll back activity; overlapping recalculation preserves committed activity");

    await reset(created.bidder_id);
    await run(() => AuctionRepository.unregisterBidder(registration.auction_bidder_id));
    await assertActive(created.bidder_id);
    assert.equal(await direct.auctions_bidders.count({ where: { auction_bidder_id: registration.auction_bidder_id } }), 0);
    const indexes = await direct.$queryRaw<{ Column_name: string }[]>`SHOW INDEX FROM bidders WHERE Key_name = 'bidders_branch_status_activity_idx'`;
    assert.deepEqual(indexes.map((index) => index.Column_name), ["branch_id", "status", "last_activity_at"]);
    await direct.bidders.update({ where: { bidder_id: staleId }, data: { status: "ACTIVE", last_activity_at: old } });
    const queryPlan = await direct.$queryRaw<Record<string, unknown>[]>`
      EXPLAIN FORMAT=JSON UPDATE bidders FORCE INDEX (bidders_branch_status_activity_idx) SET status = 'INACTIVE', updated_at = UTC_TIMESTAMP()
      WHERE branch_id = ${branchA} AND status = 'ACTIVE' AND last_activity_at <= ${getBidderActivityCutoff(now)}
        AND deleted_at IS NULL AND bidder_number <> '5013'
    `;
    assert.ok(queryPlan.length > 0);
    // Prisma/MySQL can name prepared EXPLAIN columns f0, f1, etc. JSON has one
    // column, so its value is stable regardless of the connector's field names.
    const serializedPlan = Object.values(queryPlan[0])[0];
    assert.ok(typeof serializedPlan === "string");
    assert.match(JSON.stringify(JSON.parse(serializedPlan)), /"key":"bidders_branch_status_activity_idx"/);
    console.log("Isolated classification query index: bidders_branch_status_activity_idx");
    console.log("PASS: unregistration retains bidder activity after hard deletes; composite index matches the query scope");
  } finally {
    // Remove only this run's UUID-owned fixture branches and their children.
    await direct.inventory_histories.deleteMany({ where: { inventory: { container: { branch_id: { in: branchIds } } } } });
    await direct.payments.deleteMany({ where: { receipt: { auction_bidder: { auctions: { branch_id: { in: branchIds } } } } } });
    await direct.auctions_inventories.deleteMany({ where: { auction_bidder: { auctions: { branch_id: { in: branchIds } } } } });
    await direct.receipt_records.deleteMany({ where: { auction_bidder: { auctions: { branch_id: { in: branchIds } } } } });
    await direct.auctions_bidders.deleteMany({ where: { auctions: { branch_id: { in: branchIds } } } });
    await direct.manifest_records.deleteMany({ where: { auction: { branch_id: { in: branchIds } } } });
    await direct.counter_check.deleteMany({ where: { auction: { branch_id: { in: branchIds } } } });
    await direct.auctions.deleteMany({ where: { branch_id: { in: branchIds } } });
    await direct.bidder_requirements.deleteMany({ where: { bidders: { branch_id: { in: branchIds } } } });
    await direct.bidder_ban_histories.deleteMany({ where: { bidder: { branch_id: { in: branchIds } } } });
    await direct.inventories.deleteMany({ where: { container: { branch_id: { in: branchIds } } } });
    await direct.containers.deleteMany({ where: { branch_id: { in: branchIds } } });
    await direct.bidders.deleteMany({ where: { branch_id: { in: branchIds } } });
    await direct.branches.deleteMany({ where: { branch_id: { in: branchIds } } });
    await direct.payment_methods.deleteMany({ where: { payment_method_id: `${prefix}-method` } });
    await direct.suppliers.deleteMany({ where: { supplier_id: `${prefix}-supplier` } });
    if (previousFlag === undefined) delete process.env.BIDDER_ACTIVITY_RECALCULATION_ENABLED;
    else process.env.BIDDER_ACTIVITY_RECALCULATION_ENABLED = previousFlag;
    await Promise.all([direct.$disconnect(), writer.$disconnect(), prisma.$disconnect()]);
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "Isolated MySQL checks failed.");
  process.exitCode = 1;
});
