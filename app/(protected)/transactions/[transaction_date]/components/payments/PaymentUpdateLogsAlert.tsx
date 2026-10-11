"use client";

import { useState } from "react";
import { AlertTriangle, ArrowRight, ChevronDown, ChevronUp } from "lucide-react";
import { Alert } from "@/app/components/ui/alert";
import { Button } from "@/app/components/ui/button";
import { formatDate } from "@/app/lib/utils";
import {
  formatUpdateChangeValue,
  parseUpdateActivityDescription,
} from "@/app/lib/activity-log-description";
import { ActivityLog } from "src/entities/models/ActivityLog";
import { Payment } from "src/entities/models/Payment";

interface PaymentUpdateLogsAlertProps {
  paymentUpdateLogs: ActivityLog[];
  transactions: Payment[];
}

export const PaymentUpdateLogsAlert = ({
  paymentUpdateLogs,
  transactions,
}: PaymentUpdateLogsAlertProps) => {
  const [showMore, setShowMore] = useState(false);
  if (paymentUpdateLogs.length === 0) return null;

  const paymentsById = new Map(
    transactions.map((payment) => [payment.payment_id, payment]),
  );

  return (
    <Alert className="border-yellow-500 bg-yellow-50 text-yellow-950 [&>svg]:text-yellow-700">
      <AlertTriangle />
      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-sm font-semibold">Payment modifications</div>
            <p className="text-sm text-yellow-800">
              {paymentUpdateLogs.length.toLocaleString()}{" "}
              {paymentUpdateLogs.length === 1 ? "update" : "updates"} recorded
              for the payments listed below. Includes later edits to these
              payments.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="shrink-0 border-yellow-300 bg-white/70 text-yellow-950 hover:bg-yellow-100 hover:text-yellow-950"
            onClick={() => setShowMore((shown) => !shown)}
            aria-expanded={showMore}
          >
            {showMore ? <ChevronUp /> : <ChevronDown />}
            {showMore ? "Show less" : "Show more"}
          </Button>
        </div>

        {showMore && (
          <div className="max-h-80 space-y-3 overflow-auto border-t border-yellow-200 pt-3">
            {paymentUpdateLogs.map((log) => {
              const payment = paymentsById.get(log.entity_id);
              const parsed = parseUpdateActivityDescription(log.description);

              return (
                <div
                  key={log.activity_log_id}
                  className="rounded-md border border-yellow-200 bg-white/70 p-3 shadow-sm"
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                    <div className="text-sm font-semibold text-yellow-950">
                      {payment
                        ? `Receipt #${payment.receipt.receipt_number} · Bidder ${payment.bidder.bidder_number}`
                        : "Payment update"}
                    </div>
                    <div className="text-xs text-yellow-700">
                      {formatDate(
                        new Date(log.created_at),
                        "MMM dd, yyyy hh:mm a",
                      )}
                    </div>
                  </div>
                  <div className="mt-0.5 text-xs text-yellow-700/80">
                    Edited by{" "}
                    <span className="font-medium text-yellow-900">
                      {log.username}
                    </span>
                  </div>
                  <div className="mt-2 border-t border-yellow-100 pt-2">
                    {parsed ? (
                      <div className="divide-y divide-yellow-100">
                        {parsed.changes.map((change, index) => {
                          const before = formatUpdateChangeValue(
                            change.field,
                            change.before,
                          );
                          const after = formatUpdateChangeValue(
                            change.field,
                            change.after,
                          );
                          const changed =
                            change.after.trim().length > 0 && before !== after;

                          return (
                            <div
                              key={`${change.field}-${index}`}
                              className="grid gap-x-3 gap-y-1 py-1.5 text-sm sm:grid-cols-[8rem_1fr]"
                            >
                              <span className="font-medium text-yellow-950">
                                {change.field}
                              </span>
                              <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
                                <span
                                  className={
                                    changed
                                      ? "break-words text-yellow-700/80 line-through decoration-yellow-700/50"
                                      : "break-words text-yellow-900/90"
                                  }
                                >
                                  {before || "—"}
                                </span>
                                {changed && (
                                  <>
                                    <ArrowRight className="size-3.5 shrink-0 text-yellow-600" />
                                    <span className="break-words rounded bg-yellow-200/60 px-1.5 py-0.5 font-medium text-yellow-950">
                                      {after || "—"}
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="break-words text-sm text-yellow-900/90">
                        {log.description}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Alert>
  );
};
