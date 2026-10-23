import * as activity from "src/infrastructure/repositories/bidder-activity";
import { patchMethod } from "./patch";

/** Existing business-rule tests supply their own transaction delegates. Activity
 * queries and atomicity have separate unit and real MySQL integration coverage. */
export function isolateBidderActivity(useExistingTransactionMock: boolean) {
  return patchMethod(activity, "withBidderActivity", (async (client, _scope, operation, options) => {
    if (useExistingTransactionMock) return client.$transaction(operation, options);
    return operation(client as unknown as activity.BidderActivityTransaction);
  }) as typeof activity.withBidderActivity);
}
