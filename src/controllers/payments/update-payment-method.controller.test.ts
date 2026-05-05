import test, { afterEach } from "node:test";
import assert from "node:assert/strict";

import { RequestContext } from "@/app/lib/prisma/RequestContext";
import {
  ActivityLogRepository,
  PaymentRepository,
  UserRepository,
} from "src/infrastructure/di/repositories";
import { UpdatePaymentMethodController } from "./update-payment-method.controller";
import { patchMethod } from "src/test-utils/patch";

const restorers: Array<() => void> = [];

afterEach(() => {
  while (restorers.length) {
    restorers.pop()?.();
  }
});

test("UpdatePaymentMethodController logs generic payment method wording", async () => {
  const updates: Array<{ payment_id: string; payment_method: string }> = [];
  const activityLogs: Array<{ description: string; entity_type: string }> = [];

  restorers.push(
    patchMethod(
      UserRepository,
      "getUserByUsername",
      (async () => ({ role: "ADMIN" })) as unknown as typeof UserRepository.getUserByUsername,
    ),
    patchMethod(
      ActivityLogRepository,
      "createActivityLog",
      (async (input: { description: string; entity_type: string }) => {
        activityLogs.push(input);
        return input;
      }) as unknown as typeof ActivityLogRepository.createActivityLog,
    ),
    patchMethod(
      PaymentRepository,
      "getPaymentById",
      (async () => {
        const methodName = updates.length ? "GCash" : "Cash";
        return {
          payment_id: "payment-1",
          payment_method: { name: methodName },
          remarks: updates.length
            ? "Updated payment type from Cash to GCash"
            : "Original remarks",
        };
      }) as unknown as typeof PaymentRepository.getPaymentById,
    ),
    patchMethod(
      PaymentRepository,
      "updatePaymentMethod",
      (async (payment_id: string, data: { payment_method: string }) => {
        updates.push({ payment_id, payment_method: data.payment_method });
      }) as typeof PaymentRepository.updatePaymentMethod,
    ),
  );

  const result = await RequestContext.run(
    {
      username: "admin",
      branch_id: "branch-1",
      branch_name: "Main",
    },
    async () =>
      await UpdatePaymentMethodController("payment-1", {
        payment_method: "gcash",
      }),
  );

  assert.equal(result.ok, true);
  assert.deepEqual(updates, [
    { payment_id: "payment-1", payment_method: "gcash" },
  ]);
  assert.equal(activityLogs.length, 1);
  assert.equal(activityLogs[0].entity_type, "payment");
  assert.match(
    activityLogs[0].description,
    /^Updated payment method GCash \| Payment Method: Cash/,
  );
  assert.doesNotMatch(activityLogs[0].description, /Remarks:/);
  assert.doesNotMatch(activityLogs[0].description, /gcash/);
  assert.doesNotMatch(activityLogs[0].description, /registration payment/i);
});
