import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import { JsxEmit, ModuleKind, transpileModule } from "typescript";
import * as jsxRuntime from "react/jsx-runtime";
import type { AuctionBranchComparison } from "src/entities/models/Report";
import type { Result } from "src/entities/models/Result";

// Run the real component's effects with controlled action responses and UI boundaries.
function setup() {
  const requests: Array<{ year: string; resolve: (value: Result<AuctionBranchComparison>) => void; reject: (error: Error) => void }> = [];
  const states: unknown[] = [];
  let cursor = 0;
  let effect: (() => void | (() => void)) | undefined;
  let effectDeps: unknown[] = [];
  let previousDeps: unknown[] = [];
  let cleanup: (() => void) | undefined;
  const component = () => null;
  const ui = new Proxy({}, { get: () => component });
  const boundaries: Record<string, unknown> = {
    "react/jsx-runtime": jsxRuntime,
    react: {
      useState: (initial: unknown) => {
        const index = cursor++;
        if (!(index in states)) states[index] = initial;
        return [states[index], (next: unknown) => {
          states[index] = typeof next === "function" ? next(states[index]) : next;
        }];
      },
      useMemo: (calculate: () => unknown) => calculate(),
      useEffect: (callback: typeof effect, deps: unknown[]) => { effect = callback; effectDeps = deps; },
    },
    recharts: ui,
    "@/app/components/ui/button": ui,
    "@/app/components/ui/card": ui,
    "@/app/components/ui/chart": ui,
    "@/app/components/ui/select": ui,
    "@/app/components/ui/table": ui,
    "@/app/lib/utils": { formatNumberToCurrency: (value: number) => `₱${value}` },
    "../actions": { getAuctionBranchComparison: ({ year }: { year: string }) =>
      new Promise<Result<AuctionBranchComparison>>((resolve, reject) => requests.push({ year, resolve, reject })) },
  };
  const module = { exports: {} as typeof import("./AuctionBranchComparison") };
  const code = transpileModule(readFileSync("app/(protected)/reports/components/AuctionBranchComparison.tsx", "utf8"), {
    compilerOptions: { module: ModuleKind.CommonJS, jsx: JsxEmit.ReactJSX },
  }).outputText;
  runInNewContext(code, { module, exports: module.exports, require: (id: string) => {
    assert.ok(id in boundaries, `Unexpected boundary ${id}`);
    return boundaries[id];
  }, Intl });
  const render = (year: string, active = true) => {
    cursor = 0;
    const output = module.exports.default({ year, active });
    if (effectDeps.length !== previousDeps.length || effectDeps.some((value, index) => value !== previousDeps[index])) {
      cleanup?.();
      cleanup = effect?.() || undefined;
      previousDeps = [...effectDeps];
    }
    return output;
  };
  return { requests, states, render, dispose: () => cleanup?.() };
}

const comparison = (year: string): AuctionBranchComparison => ({
  year,
  branches: ["First", "Second"].map((name, index) => ({
    branch_id: `branch-${index}`, branch_name: name,
    summary: { total_sales: 100, items_sold: 2, bidder_attendances: 1, total_registration_fee: 20,
      highest_item_sold: 60, avg_selling_price: 50, auction_count: 1 },
    months: Array.from({ length: 12 }, (_, month) => ({ month: `${year}-${month + 1}`,
      total_sales: 100, items_sold: 2, bidder_attendances: 1, total_registration_fee: 20,
      highest_item_sold: 60, avg_selling_price: 50, auction_count: 1 })),
  })),
});
const flush = async () => { await Promise.resolve(); await Promise.resolve(); };

test("comparison requests only when active and reuses loaded data for view, branch and metric changes", async () => {
  const fixture = setup();
  fixture.render("2026", false);
  assert.equal(fixture.requests.length, 0);
  fixture.render("2026");
  assert.equal(fixture.requests.length, 1);
  fixture.requests[0].resolve({ ok: true, value: comparison("2026") });
  await flush();
  fixture.render("2026");
  fixture.states[2] = ["branch-0"];
  fixture.states[3] = "items_sold";
  fixture.render("2026");
  fixture.render("2026", false);
  fixture.render("2026");
  assert.equal(fixture.requests.length, 1);
  fixture.dispose();
});

test("comparison ignores older year responses and fetches hidden years only when opened", async () => {
  const fixture = setup();
  fixture.render("2026");
  fixture.render("2027");
  fixture.requests[1].resolve({ ok: true, value: comparison("2027") });
  await flush();
  fixture.requests[0].resolve({ ok: true, value: comparison("2026") });
  await flush();
  assert.equal((fixture.states[0] as { data: AuctionBranchComparison }).data.year, "2027");
  fixture.render("2028", false);
  assert.equal(fixture.requests.length, 2);
  fixture.render("2028");
  assert.equal(fixture.requests[2].year, "2028");
  fixture.dispose();
  fixture.requests[2].resolve({ ok: true, value: comparison("2028") });
  await flush();
  assert.equal((fixture.states[0] as { status: string }).status, "loading");
});

test("comparison handles errors and caches a successful retry", async () => {
  const fixture = setup();
  fixture.render("2026");
  fixture.requests[0].reject(new Error("Network failed"));
  await flush();
  assert.equal((fixture.states[0] as { status: string }).status, "error");
  fixture.states[1] = 1;
  fixture.render("2026");
  fixture.requests[1].resolve({ ok: true, value: comparison("2026") });
  await flush();
  fixture.render("2026", false);
  fixture.render("2026");
  assert.equal(fixture.requests.length, 2);
  assert.equal((fixture.states[0] as { status: string }).status, "ready");
  fixture.dispose();
});
