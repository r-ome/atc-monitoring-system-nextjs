# Bidder activity: stage 1 operation and push review

This is the historical stage 1 report. See [the completed rollout guide](bidder-activity-rollout.md) for current behavior and deployment order.

## Implemented

- Nullable `bidders.last_activity_at DATETIME(0)`.
- Composite index on `(branch_id, status, last_activity_at)`.
- A preview-first, explicitly scoped historical initialization tool.
- A shared six-calendar-month cutoff using Manila time and whole-second precision.
- Regression coverage for cutoff calculation, initialization queries, batching, and write safeguards.

Automatic status recalculation and ongoing activity tracking are not enabled in this stage.
The bidders page continues using its existing registration-based Last Active display.

## Run the tool

Use a full repository checkout with dependencies installed and the matching migration applied.
The standalone web release and migrations-runner alone do not contain the required TypeScript sources and tooling.
Use the intended database's `DATABASE_URL`; Prisma can also load the checkout's configured environment file.

Show usage without connecting to a database:

```sh
npm run bidders:activity -- --help
```

Preview one branch. Replace `BRANCH_ID` with its actual ID:

```sh
npm run bidders:activity -- --branch-id BRANCH_ID
```

Preview every branch explicitly:

```sh
npm run bidders:activity -- --all-branches
```

The preview reports eligible bidders, missing timestamps, tracked bidders, potential status changes,
and future timestamps for each branch. It does not print bidder names, payment details, or connection credentials.
Potential status changes remain a preview; the tool never changes statuses.

After activity tracking is complete and the historical preview has been reviewed, initialize missing timestamps:

```sh
npm run bidders:activity -- --branch-id BRANCH_ID --apply
```

Do not perform the final initialization against application data before stages 2–4 are ready.
Older application versions do not track all new activity between initialization and the later deployment.

Both modes accept `--batch-size N`, from 1 to 1000. The default is 200.
Each batch uses a separate transaction. A failed apply can leave earlier batches committed.
Rerunning apply is safe: it fills only timestamps that are still null.
If a concurrent activity writer initializes a bidder first, the tool preserves that timestamp.
The applied count can therefore be lower than the previewed missing count.

## Historical limits

For untracked bidders, initialization takes the latest available timestamp from the bidder row and retained related records.
Sources include registration, requirements, bans, auction items, inventory edits, receipts, payments, and inventory histories.
Successful manifests and counter-checks join through auction registration and bidder identity.
Failed manifest and counter-check imports do not count.

Already-tracked timestamps remain authoritative. Later runs do not reinterpret ordinary `updated_at` as activity.
The tool preserves `bidders.updated_at` during initialization by using a parameterized SQL update.
It excludes banned, deleted, and internal ATC bidders.

Historical edits and reassignment can make timestamps ambiguous. Hard-deleted activity may be unrecoverable.
Future timestamps require review before automatic status updates are enabled.

## Verification completed locally

- Baseline: TypeScript passes and 223 regression tests pass.
- Stage 1: TypeScript passes and 241 regression tests pass.
- `npm run build` completes successfully.
- CLI usage works without a database connection.
- A temporary MySQL 8.0.45 instance validates the migration against the previous schema and seven synthetic bidders.
- MySQL checks verify preview, apply, branch isolation, exclusions, failed imports, repeated apply, newer activity preservation,
  unchanged statuses and `updated_at`, and real transaction rollback.
- Overlapping MySQL transactions verify that initialization preserves activity, bans, and branch moves committed by another writer.

No application database migration or initialization runs during these checks.

## Push assessment

The local `main` and freshly fetched `origin/main` have no commit divergence at the time of this review.
This is not a merge conflict or deployment guarantee for future remote changes.

The workflow in `.github/workflows/deploy.yml` deploys pushes to `main`.
It runs regression tests and builds a standalone release, then applies migrations before reloading the application.
The new nullable column and index are additive. No existing data is deleted and no status is changed by the migration.
The initialization script does not run automatically during build or deployment.

The generated Prisma client selects the new column in normal bidder queries.
The migration must therefore succeed before the new application version serves requests.
Deploying the generated client against the old schema can fail with a missing-column error.

Production migration history, database locks, migration duration, EC2 runtime state, and production concurrency remain unverified.
Adding the index can contend with database writes; production duration is unmeasured.
The deployment workflow replaces runtime files before migration. A migration failure does not trigger an automatic rollback.
Do not treat passing local checks as proof that a failed production migration will recover automatically.

Existing unrelated `.gitignore`, workbook, and documentation changes are not part of this stage.
Do not stage the whole workspace when preparing a commit.
No commit, push, or deployment is performed as part of stage 1.
