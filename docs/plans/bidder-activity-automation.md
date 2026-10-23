# Bidder activity automation plan

Status: All code stages implemented locally. Production rollout is separate.

See [stage 1 operation and push review](bidder-activity-stage-1.md) for commands, verification, and deployment limits.
See [completed implementation and rollout](bidder-activity-rollout.md) for current behavior and activation steps.

## Outcome

Starting an auction recalculates ACTIVE and INACTIVE bidders for that auction's branch.
Each successful bidder action records activity and reactivates an inactive bidder.
BANNED status always takes precedence.

## Agreed rules and implementation defaults

- The inactivity period is six calendar months.
- Activity includes successful saved actions involving a bidder, including staff edits, corrections, and deletions.
- Activity is not limited to auction registration or payment.
- Views, searches, previews, and report downloads do not record bidder activity.
- Failed or rolled-back operations do not record activity.
- Automatic status recalculation, audit logging, and historical initialization do not record new activity.
- Bidder creation and bulk upload initialize activity for the created bidders only.
- Existing activity anywhere in a bidder's history counts, including activity on an older auction.
- The internal ATC bidder, number 5013, does not participate in automatic status updates.
- Deleted bidders do not participate in automatic status updates.
- No daily scheduler or manual recalculation button is included.

ACTIVE and INACTIVE describe calculated activity status. This plan adds no persistent manual inactivity override.
Manual status actions count as activity, but they cannot make a recent bidder permanently INACTIVE.
A manual INACTIVE value can therefore return to ACTIVE during the next recalculation.
Ban and unban remain explicit actions. Activity never removes a ban.

## Data and date policy

Add nullable `bidders.last_activity_at`, using the repository's existing timestamp conventions.
Add a composite index on `(branch_id, status, last_activity_at)`.
Initialize all existing eligible bidders before enabling recalculation.
New bidder writes must always supply the activity timestamp.

Do not use `bidders.updated_at` as the ongoing activity source.
Automatic status writes change that field and would otherwise extend the inactivity period.

Calculate the cutoff once per auction-start operation:

1. Capture the actual current instant.
2. Subtract six calendar months in `Asia/Manila`, with month-end clamping.
3. Preserve the local time of day and convert the result to a database comparison instant.
4. Use the timestamp precision supported by the database.

Activity at or before the cutoff means INACTIVE. Activity after the cutoff means ACTIVE.
Do not round the cutoff to midnight or use the selected auction date.
Backdated auctions must not move the inactivity cutoff backwards.

## Activity coverage

| Area | Required coverage |
| --- | --- |
| Bidder account | Creation, bulk upload, profile edits, branch moves, manual status actions |
| Requirements and bans | Add, edit, delete, ban, unban, and ban-history removal |
| Registration | Register, update registration, unregister |
| Manifests and counter-checks | Successful saved changes involving an identifiable bidder; exclude failed imports and previews |
| Auction items | Encode, add, edit, purchase, reassign, cancel, refund, split, merge, void, and delete |
| Payments | Payment, pullout, storage fee, payment-method correction, and undo |
| Reconciliation | Final-report matches, counter-check matches, add-ons, and container or inventory changes affecting a bidder's items |
| Report corrections | Saved bidder-related corrections, including refund/cancellation tags |

Capture the affected bidder IDs before removing records or changing ownership.
Record activity for both previous and new bidders during reassignment.
Resolve bidder-number-only records using their auction and branch. Bidder number alone is insufficient.
Include persisted business changes from reconciliation; exclude the status maintenance operation itself.

Maintain a checklist of repository methods during implementation.
Every method must either record activity or have an explicit reason for exclusion.

## Shared write behavior

Introduce one infrastructure helper that accepts the current transaction and affected bidder IDs.

The helper must:

- Remove duplicate IDs from batch operations.
- Advance activity without replacing a newer timestamp with an older one.
- Reactivate only INACTIVE bidders. Preserve BANNED status.
- Preserve branch authorization and explicit ownership checks.
- Run inside the same transaction as the business change.
- Avoid one activity update for every manifest or inventory row.

Convert standalone writes to transactions where activity needs a second write.
Replace the existing registration and pullout reactivation blocks with this shared behavior.
Do not add a generic Prisma hook: it cannot reliably distinguish business changes from status maintenance.

Account for the current Prisma extension's branch filters.
An `updateMany` must not silently skip activity after a branch move.
Write activity in the bidder's branch-change update where possible.
Test cross-branch affected records explicitly; do not bypass authorization to make the helper succeed.

## Auction startup and branch selection

Resolve and authorize a real target branch before any mutation.
Ordinary users use their authorized branch.
Global users must supply an authorized target branch when their session represents the super-admin branch.
Require branch selection in that startup path if the current UI cannot supply it.
Do not infer the target from the database default or the first matching ATC bidder.

Use the same target branch for:

- The internal ATC bidder lookup.
- The new auction's explicit `branch_id`.
- The execution context and audit log.
- Bidder status recalculation.

Inside the auction-start transaction:

1. Create the auction and its internal registration.
2. Deactivate eligible ACTIVE bidders whose activity is at or before the cutoff.
3. Reactivate eligible INACTIVE bidders whose activity is after the cutoff.
4. Return the auction and both changed counts.

Use two conditional bulk updates, rather than reading IDs and updating them later.
Each update filters by actual auction branch, current status, activity cutoff, deletion state, and ATC exclusion.
Do not change `last_activity_at` during these updates.
Do not treat an uninitialized null timestamp as recent activity; fail the readiness check before enabling this path.

If auction creation or recalculation fails, roll back both.
Repeated recalculation must leave unchanged bidders untouched.
Use a consistent lock order and test contention with genuine activity writes.

Migrate only the affected startup action to `authorizeAction` and `runWithUserContext` conventions.
Preserve existing role access, with explicit authorization for target-branch selection.

## Historical initialization and rollout

Historical activity cannot always be reconstructed exactly.
Some workflows permanently delete records. Existing timestamps do not always identify the reason for a change.

Provide a repeatable initialization script and a read-only preview mode.

1. Inventory retained timestamp sources and their bidder relationships.
2. Capture existing source timestamps before any migration-related application writes change them.
3. Calculate the latest available timestamp across bidder creation, bidder edits, and related activity records.
4. Include retained registration, requirement, ban, item, receipt, payment, and relevant history timestamps.
5. Use account creation when no later evidence exists.
6. Preserve any newer `last_activity_at` already recorded by the application.
7. Report ambiguous historical evidence and counts of proposed status changes per branch.
8. Verify coverage and review the preview before enabling auction-start recalculation.

Never initialize every bidder to deployment time.
Historical `updated_at` values are conservative evidence, not proof of a specific activity type.
Audit logs can supplement retained records but cannot be the only source.

Roll out the schema and complete activity tracking before the final initialization pass.
Keep recalculation disabled until initialization and tracking are verified.
This prevents activity between deployments from being lost or overwritten.

## Bidders page and logging

Use `last_activity_at` for the desktop and mobile Last Active display.
Change the tooltip from Last Auction to Last Activity.
Retain a raw timestamp for sorting and format the date for display.
Use the same date policy as the status calculation.

Remove the full auction-registration include from the list query if no list consumer needs it.
Update the named list row type and its consumers together.

After successful startup, revalidate `/bidders` and retain the existing auction refresh behavior.
Record the target branch, cutoff, and activated/deactivated counts in the existing activity log.
Audit-log failure must not undo an already committed auction.
Keep existing audit-log policy unchanged; the log is not the activity source of truth.

## Implementation stages

The user approves completing the remaining stages together. Keep production recalculation disabled until initialization is reviewed.

1. **Schema and initialization tooling:** field, composite index, initialization script, and preview output.
2. **Shared activity behavior:** helper, creation/upload initialization, profile/requirement/ban paths, and focused tests.
3. **Auction activity:** registration, unregistration, manifests, counter-checks, reassignment, and focused tests.
4. **Payments and item activity:** payments, refunds, undo, inventories, containers, reconciliation, report corrections, and focused tests.
5. **Bidders display:** presenter, list query, row types, sorting, tooltip, and mobile display.
6. **Startup integration:** explicit branch selection, conditional recalculation, transaction behavior, revalidation, and count logging.
7. **Readiness and rollout:** final initialization preview, required checks, database concurrency checks, and enablement.

Keep use cases only where they contain date policy, branching, or orchestration.
Keep transaction implementation and batched persistence in infrastructure.
Do not introduce repository-delegating wrapper use cases.

## Verification and acceptance

Register every new regression test in `src/regression.test.ts`.
Also register the existing auction repository test file, which the current runner does not import.

Cover:

- Before, at, and after the six-month cutoff.
- Month ends, leap years, Manila midnight boundaries, and database timestamp precision.
- Creation, upload, all activity categories, hard deletes, and reassignment.
- Activity on an old auction and startup with a historical auction date.
- BANNED precedence, unban, deleted bidders, and internal ATC exclusions.
- Ordinary and global-user branch selection, branch moves, and identical bidder numbers across branches.
- Conditional update predicates, unchanged rows, changed counts, and repeated recalculation.
- Error propagation, transaction call placement, initialization readiness, and preservation of newer activity.
- Last Active display and sorting from the shared timestamp.

Run after each code stage:

```sh
npx tsc --noEmit
npm run test:regression
```

Mocked tests verify predicates and control flow. They do not prove database rollback or locking.
Use an isolated MySQL test database or staging to verify real rollback, concurrent activity, bans, and lock contention.
Measure startup duration and inspect the recalculation query plan with the composite index.
Runtime overhead remains unmeasured until that check runs.

## Change boundaries

Local changes include source code, migration files, initialization tooling, and tests.
Deployment requires applying the schema migration and running initialization against the target database.
This plan does not authorize production execution, deployment, or commits.
No new external service, dependency, or scheduler is required.

Primary areas: Prisma schema/migrations; bidder model and repository interfaces; bidder, requirement, ban, auction,
payment, inventory, container, and report repositories; auction manifest writes; startup controller/action/UI;
bidders presenter/table; regression tests.

The plan incorporates Claude's read-only review. All code stages are implemented; production activation remains an explicit rollout step.
