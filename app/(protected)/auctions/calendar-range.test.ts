import assert from "node:assert/strict";
import test from "node:test";
import { getFullMonthFetchRange } from "./calendar-range";

test("getFullMonthFetchRange expands partial calendar-grid months", () => {
  const result = getFullMonthFetchRange(
    new Date(2026, 2, 29),
    new Date(2026, 3, 4),
  );

  assert.equal(result.fetchStart.getFullYear(), 2026);
  assert.equal(result.fetchStart.getMonth(), 2);
  assert.equal(result.fetchStart.getDate(), 1);
  assert.equal(result.fetchStart.getHours(), 0);
  assert.equal(result.fetchStart.getMinutes(), 0);
  assert.equal(result.fetchStart.getSeconds(), 0);
  assert.equal(result.fetchStart.getMilliseconds(), 0);

  assert.equal(result.fetchEnd.getFullYear(), 2026);
  assert.equal(result.fetchEnd.getMonth(), 3);
  assert.equal(result.fetchEnd.getDate(), 30);
  assert.equal(result.fetchEnd.getHours(), 23);
  assert.equal(result.fetchEnd.getMinutes(), 59);
  assert.equal(result.fetchEnd.getSeconds(), 59);
  assert.equal(result.fetchEnd.getMilliseconds(), 999);

  assert.deepEqual(result.monthKeys, ["2026-03", "2026-04"]);
});
