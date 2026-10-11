import test from "node:test";
import assert from "node:assert/strict";

import {
  formatUpdateChangeValue,
  parseUpdateActivityDescription,
} from "./activity-log-description";

test("payment method logs display the recorded old and new methods", () => {
  for (const arrow of ["→", "->"]) {
    const parsed = parseUpdateActivityDescription(
      `Updated payment method for receipt #0203-1 to BDO | Payment Method: Cash ${arrow} BDO`,
    );

    assert.equal(parsed?.type, "generic");
    assert.deepEqual(parsed?.changes, [
      { field: "Payment Method", before: "Cash", after: "BDO" },
    ]);
  }
});

test("older payment logs without a recorded difference use the plain description", () => {
  assert.equal(
    parseUpdateActivityDescription(
      "Updated payment method for receipt #0203-1 to BDO",
    ),
    null,
  );
});

test("payment method names preserve bank account details", () => {
  const method = "BDO - ACCOUNT 1234567890";
  assert.equal(formatUpdateChangeValue("Payment Method", method), method);
});
