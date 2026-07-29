import test from "node:test";
import assert from "node:assert/strict";

import { allocateStorageFee } from "./StorageFeeAllocation";

test("allocateStorageFee settles the storage fee on the trailing tender entry", () => {
  const { entries, storageRows } = allocateStorageFee(
    [
      { payment_method: "pm-1", amount_paid: 1000 },
      { payment_method: "pm-2", amount_paid: 400 },
    ],
    400,
  );

  assert.deepEqual(
    entries.map((entry) => [entry.pullOutAmount, entry.storageAmount]),
    [
      [1000, 0],
      [0, 400],
    ],
  );
  assert.deepEqual(storageRows, [{ payment_method: "pm-2", amount_paid: 400 }]);
});

test("allocateStorageFee keeps duplicate methods as separate pull-out entries", () => {
  const { entries, storageRows } = allocateStorageFee(
    [
      { payment_method: "bdo", amount_paid: 50000 },
      { payment_method: "bdo", amount_paid: 5772 },
    ],
    400,
  );

  assert.deepEqual(
    entries.map((entry) => [entry.pullOutAmount, entry.storageAmount]),
    [
      [50000, 0],
      [5372, 400],
    ],
  );
  assert.deepEqual(storageRows, [{ payment_method: "bdo", amount_paid: 400 }]);
});

test("allocateStorageFee groups equal duplicate-method entries into one storage row", () => {
  const { entries, storageRows } = allocateStorageFee(
    [
      { payment_method: "bdo", amount_paid: 300 },
      { payment_method: "bdo", amount_paid: 300 },
    ],
    500,
  );

  assert.deepEqual(
    entries.map((entry) => [entry.pullOutAmount, entry.storageAmount]),
    [
      [100, 200],
      [0, 300],
    ],
  );
  assert.deepEqual(storageRows, [{ payment_method: "bdo", amount_paid: 500 }]);
});

test("allocateStorageFee spans methods only when trailing entries cannot cover the fee", () => {
  const { entries, storageRows } = allocateStorageFee(
    [
      { payment_method: "bpi", amount_paid: 1200 },
      { payment_method: "gcash", amount_paid: 200 },
    ],
    400,
  );

  assert.deepEqual(
    entries.map((entry) => [entry.pullOutAmount, entry.storageAmount]),
    [
      [1000, 200],
      [0, 200],
    ],
  );
  assert.deepEqual(storageRows, [
    { payment_method: "bpi", amount_paid: 200 },
    { payment_method: "gcash", amount_paid: 200 },
  ]);
});

test("allocateStorageFee leaves earlier methods untouched when the last tender covers the fee", () => {
  const { entries, storageRows } = allocateStorageFee(
    [
      { payment_method: "bdo", amount_paid: 49652 },
      { payment_method: "cash", amount_paid: 20000 },
      { payment_method: "gcash", amount_paid: 7388 },
    ],
    400,
  );

  assert.deepEqual(
    entries.map((entry) => [entry.pullOutAmount, entry.storageAmount]),
    [
      [49652, 0],
      [20000, 0],
      [6988, 400],
    ],
  );
  assert.deepEqual(storageRows, [
    { payment_method: "gcash", amount_paid: 400 },
  ]);
});

test("allocateStorageFee conserves the submitted gross total exactly", () => {
  const payments = [
    { payment_method: "bpi", amount_paid: 15040 },
    { payment_method: "gcash", amount_paid: 20431 },
    { payment_method: "bpi", amount_paid: 9679 },
    { payment_method: "gcash", amount_paid: 14600 },
  ];
  const storageFee = 1000;

  const { entries, storageRows } = allocateStorageFee(payments, storageFee);

  const gross = payments.reduce((total, item) => total + item.amount_paid, 0);
  const pullOutTotal = entries.reduce(
    (total, entry) => total + entry.pullOutAmount,
    0,
  );
  const storageTotal = storageRows.reduce(
    (total, row) => total + row.amount_paid,
    0,
  );

  assert.equal(storageTotal, storageFee);
  assert.equal(pullOutTotal + storageTotal, gross);
  assert.equal(entries.length, payments.length);
  assert.ok(entries.every((entry) => Number.isInteger(entry.pullOutAmount)));
});

test("allocateStorageFee emits no storage rows when there is no storage fee", () => {
  const { entries, storageRows } = allocateStorageFee(
    [
      { payment_method: "bdo", amount_paid: 5000 },
      { payment_method: "bdo", amount_paid: 670 },
    ],
    0,
  );

  assert.deepEqual(
    entries.map((entry) => [entry.pullOutAmount, entry.storageAmount]),
    [
      [5000, 0],
      [670, 0],
    ],
  );
  assert.deepEqual(storageRows, []);
});
