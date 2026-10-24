# Bidder activity automation: implementation and rollout

## Implemented behavior

Each successful bidder-related business write records `last_activity_at` in the same transaction.
It reactivates INACTIVE bidders and preserves BANNED status.
Direct bidder writes lock current branch ownership before recording activity.
Deletes capture ownership first. Reassignment records both affected bidders.
Batch operations remove duplicate bidder IDs and use bounded activity updates.
Deadlocks retry the complete transaction, up to three attempts.

Auction startup can recalculate statuses for its explicit, authorized branch.
The bidders page also provides a "Recalculate status" button using the same rule and readiness checks.
OWNER and SUPER_ADMIN select a branch. ADMIN and CASHIER can recalculate only their own branch.
The button reports activated/deactivated counts and refreshes the status cards and table.
Manual recalculation records an activity log but does not count as bidder activity.
Six calendar months without activity means INACTIVE, including the exact cutoff second.
The cutoff uses current Manila time, preserves the time of day, and clamps month ends.
The selected auction date does not affect the cutoff.
Deleted bidders and ATC bidder 5013 are excluded from automatic changes.
Recalculation does not update the activity timestamp.

The bidders page uses the shared activity timestamp for desktop/mobile display and date sorting.
Until a bidder has that timestamp, the page falls back to the latest auction registration date.
This fallback affects display only; it does not initialize activity or recalculate status.
The list query no longer loads every auction registration.
Auction startup revalidates the bidders page and records changed counts in the existing activity log.
The existing SUPER_ADMIN audit-log exclusion remains in place.
The backend enforces startup access for OWNER, SUPER_ADMIN, ADMIN, and CASHIER, matching the existing UI restriction.
Global sessions must select a real branch.

Online activity writes use the primary index. Conditional classification updates explicitly use the composite activity index.
These updates remain parameterized and check the current status and activity cutoff while acquiring write locks.

Manual status saves count as activity. A manual INACTIVE value is not a persistent override.
The next recalculation can return a recent bidder to ACTIVE. Ban/unban remain explicit actions.

## Write coverage

| Repository | Activity paths |
| --- | --- |
| Bidders | Create/upload initialize the field; profile edits, branch moves, and manual status changes |
| Requirements | Create, update, delete |
| Ban history | Ban, delete history; unban uses the explicit bidder-status action |
| Auctions | Register, edit registration, unregister; upload/edit manifests and counter-checks; cancel items |
| Payments | Pullout, refund/LESS, storage fee, payment-method correction, undo |
| Inventories | Auction-item edits, reassignment, final-report matching, counter-check matching, add-ons, metadata/status edits, merge, append, split, void, direct bought item, delete |
| Containers | Inventory-file updates, container edits, paid-date changes, deletion, tax-deduction changes |
| Reports | Refund/cancellation tag corrections, including the original bidder after transfer to ATC |

Inventory/container operations resolve bidders through authorized inventory records.
This includes bidders who move branches after attending an auction.
Number-only records resolve through their auction registration, without truncating longer bidder numbers.
Cancellation history uses receipt identity when available, then the existing structured remark parser and auction registration.

Excluded writes have no bidder business activity:

- New unassigned inventories or containers have no bidder yet.
- Failed import records and removal of failed manifest records do not count.
- Report draft buffers and saved reconciliation summaries are workflow/cache state; their actual business changes are tracked above.
- Reads, previews, exports, audit logging, historical initialization, and status recalculation do not count.

## Deployment order

Deploy through the existing workflow. There is no enable/disable setting or separate production initialization step.

Auction startup and "Recalculate status" directly call the same function for the selected branch.
The function first fills missing activity timestamps from retained business history, in batches of 200.
It then updates active/inactive statuses. Initialization and recalculation share the caller's transaction.
If any step fails, the transaction rolls back, including auction creation when applicable.

Already tracked timestamps stay authoritative. Later calls do not rescan their historical records.
Future timestamps produce an error instead of classifying invalid history.
Historical timestamps remain estimates where old records have been permanently deleted.

The existing `npm run bidders:activity -- --branch-id ID` command remains an optional history preview for a full checkout.
The application does not need this command to work on production.

## Verification

Default checks, including existing auction repository tests that previously had no runner import:

```sh
npx tsc --noEmit
npm run test:regression
npm run build
```

Optional real database checks:

```sh
BIDDER_ACTIVITY_TEST_DATABASE_URL='mysql://USER:PASSWORD@127.0.0.1:3306/atc_bidder_activity_test_local' npm run test:bidder-activity:mysql
```

Prepare the dedicated local database with the current schema first.
The integration command requires a local host and database name beginning `atc_bidder_activity_test`.
It never falls back to the application's database URL.
It creates UUID-owned synthetic fixture branches and removes only those fixtures afterwards.
It is separate from normal CI regression tests, which do not require a database.

The MySQL suite covers readiness rollback, historical preview/apply, actual classification, branch isolation, creation,
profile edits, requirements, bans/unban, registration, payment corrections, storage fees, counter-check corrections,
item edits, reassignment, container financial edits, branch transfers, original-bidder tag corrections,
failed-operation rollback, overlapping activity/recalculation transactions, hard deletion, and the composite index.

Verification completed locally on 2026-10-17:

- `npx tsc --noEmit` passes.
- All 278 regression tests pass, including the previously unregistered auction repository tests.
- `npm run build` passes.
- The real MySQL 8.0.45 integration suite passes on an isolated socket with synthetic data.
- The conditional UPDATE execution plan uses `bidders_branch_status_activity_idx`.
- Deployment YAML parses and places successful migration before runtime replacement under `set -e`.
- A refreshed comparison finds no commit divergence between local `main` and `origin/main`.

Startup timing in this suite is a measurement of a small local synthetic dataset, not production latency.
The isolated suite checks the actual conditional UPDATE plan with `EXPLAIN FORMAT=JSON`.
Production query plans, migration duration, and lock contention still require observation on the target database.

## Push assessment

Pushing `main` triggers the existing EC2 deployment workflow.
It runs regression tests and builds the standalone app, then applies migrations before reloading the app.
The nullable field/index migration is additive; no status changes or historical initialization run during migration or build.
Keep the new migration with the code: the generated Prisma client expects the new column.

The simplification does not change the deployment workflow or require manual server uploads/settings.
The updated workflow replaces runtime files only after migrations succeed.
A migration failure therefore does not replace the existing runtime files.
Automatic database rollback and recovery from a later runtime replacement/reload failure are not implemented.
An index build can contend with writes; production duration remains unmeasured.
Local tests and build success do not remove those deployment limits.

Existing unrelated workspace changes must remain outside this feature's commit.
