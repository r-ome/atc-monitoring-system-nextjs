import test from "node:test";
import assert from "node:assert/strict";
import { presentBidders } from "./get-bidders.controller";
import { BidderListRow } from "src/entities/models/Bidder";

test("bidder list presents the shared activity timestamp independently of auction registration", () => {
  const date = new Date("2026-10-17T01:02:03.000Z");
  const row: BidderListRow = {
    bidder_id: "bidder", bidder_number: "0007", first_name: "Test", middle_name: null, last_name: "Bidder",
    birthdate: null, contact_number: null, registration_fee: 0, service_charge: 0, status: "ACTIVE", remarks: null,
    address: null, tin_number: null, store_name: null, branch_id: "branch", payment_term: 7,
    created_at: date, updated_at: date, deleted_at: null, last_activity_at: date,
    branch: { branch_id: "branch", name: "Test", created_at: date, updated_at: date, deleted_at: null },
    auctions_joined: [],
  };
  const activity = presentBidders([row])[0].last_active;
  assert.equal(activity.date, "Oct 17, 2026");
  assert.equal(activity.timestamp, date.toISOString());
  assert.equal(typeof activity.duration, "string");
  assert.deepEqual(presentBidders([{ ...row, last_activity_at: null }])[0].last_active, {
    date: null, timestamp: null, duration: null,
  });

  const registration = new Date("2026-10-18T01:02:03.000Z");
  const legacyRow: BidderListRow = { ...row, last_activity_at: null, auctions_joined: [{ created_at: registration }] };
  const fallback = presentBidders([legacyRow])[0].last_active;
  assert.equal(fallback.date, "Oct 18, 2026");
  assert.equal(fallback.timestamp, registration.toISOString());
  assert.equal(typeof fallback.duration, "string");
  assert.equal(legacyRow.last_activity_at, null);
  assert.deepEqual(presentBidders([{ ...legacyRow, last_activity_at: date }])[0].last_active, activity);
});
