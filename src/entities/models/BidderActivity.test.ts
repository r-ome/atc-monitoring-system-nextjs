import test from "node:test";
import assert from "node:assert/strict";
import { getBidderActivityCutoff } from "./BidderActivity";

test("bidder activity uses six calendar months and whole-second precision", () => {
  assert.equal(
    getBidderActivityCutoff(new Date("2026-10-17T10:12:34.987Z")).toISOString(),
    "2026-04-17T10:12:34.000Z",
  );
});

test("bidder activity clamps the target day at month end, including leap years", () => {
  assert.equal(
    getBidderActivityCutoff(new Date("2026-08-31T01:02:03.000Z")).toISOString(),
    "2026-02-28T01:02:03.000Z",
  );
  assert.equal(
    getBidderActivityCutoff(new Date("2024-08-31T01:02:03.000Z")).toISOString(),
    "2024-02-29T01:02:03.000Z",
  );
});

test("bidder activity subtracts months on the Manila date, not the UTC date", () => {
  assert.equal(
    getBidderActivityCutoff(new Date("2026-03-31T18:45:00.000Z")).toISOString(),
    "2025-09-30T18:45:00.000Z",
  );
});

test("bidder activity ignores the host time zone and its daylight-saving gap", () => {
  const original = process.env.TZ;
  try {
    for (const zone of ["UTC", "Asia/Manila", "America/Los_Angeles", "America/New_York"]) {
      process.env.TZ = zone;
      assert.equal(
        getBidderActivityCutoff(new Date("2026-09-07T18:30:00.000Z")).toISOString(),
        "2026-03-07T18:30:00.000Z",
        zone,
      );
      assert.equal(
        getBidderActivityCutoff(new Date("2026-03-07T18:30:00.000Z")).toISOString(),
        "2025-09-07T18:30:00.000Z",
        zone,
      );
    }
  } finally {
    if (original === undefined) delete process.env.TZ;
    else process.env.TZ = original;
  }
});

test("bidder activity rejects an invalid clock", () => {
  assert.throws(() => getBidderActivityCutoff(new Date("invalid")), /valid current time/);
});
