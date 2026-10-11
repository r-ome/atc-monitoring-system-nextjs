import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { transpileModule, ModuleKind, JsxEmit } from "typescript";
import * as jsxRuntime from "react/jsx-runtime";

test("financial tab loads expense detail only for SUPER_ADMIN and retains summary errors", async () => {
  let detailReads = 0;
  let summaryOk = true;
  let detailOk = true;
  const SalesTable = () => null;
  const ExpensesSummaryTable = () => null;
  const ErrorComponent = () => null;
  const boundaries: Record<string, unknown> = {
    "react/jsx-runtime": jsxRuntime,
    "src/controllers/reports/get-financial-report.controller": {
      GetFinancialReportController: async () => summaryOk
        ? { ok: true, value: { salesExpensesSummary: { totals: { expenses: 125.5 } } } }
        : { ok: false, error: { message: "Summary failed" } },
    },
    "./SalesTable": { SalesTable },
    "./ExpensesSummaryTable": { ExpensesSummaryTable },
    "@/app/components/ErrorComponent": { ErrorComponent },
    "../actions": { getExpensesSummary: async () => {
      detailReads++;
      return detailOk ? { ok: true, value: [] } : { ok: false, error: { message: "Detail failed" } };
    } },
  };
  const module = { exports: {} as typeof import("./FinancialTabContent") };
  const code = transpileModule(readFileSync("app/(protected)/reports/components/FinancialTabContent.tsx", "utf8"), {
    compilerOptions: { module: ModuleKind.CommonJS, jsx: JsxEmit.ReactJSX },
  }).outputText;
  runInNewContext(code, { module, exports: module.exports, require: (id: string) => {
    assert.ok(id in boundaries, `Unexpected boundary: ${id}`);
    return boundaries[id];
  } });
  const props = { branchId: "branch-1", branchName: "Branch", dateParam: "2026", mode: "daily" as const };
  detailOk = false;
  for (const role of ["ADMIN", "CASHIER", "ENCODER"]) {
    const output = await module.exports.FinancialTabContent({ ...props, userRole: role });
    assert.equal(output.type, "div");
    assert.equal(output.props.children[0].type, SalesTable);
    assert.equal(output.props.children[0].props.summary.totals.expenses, 125.5);
    assert.equal(output.props.children[1], null);
  }
  assert.equal(detailReads, 0);
  const failedDetail = await module.exports.FinancialTabContent({ ...props, userRole: "SUPER_ADMIN" });
  assert.equal(failedDetail.type, ErrorComponent);
  assert.equal(failedDetail.props.error.message, "Detail failed");
  detailOk = true;
  const admin = await module.exports.FinancialTabContent({ ...props, userRole: "SUPER_ADMIN" });
  assert.equal(admin.props.children[1].type, ExpensesSummaryTable);
  assert.equal(detailReads, 2);
  summaryOk = false;
  const failedSummary = await module.exports.FinancialTabContent({ ...props, userRole: "ADMIN" });
  assert.equal(failedSummary.type, ErrorComponent);
  assert.equal(failedSummary.props.error.message, "Summary failed");
  assert.equal(detailReads, 2);
});
