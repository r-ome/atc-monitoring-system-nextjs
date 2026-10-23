import { PrismaClient } from "@prisma/client";
import { getBidderActivityCutoff } from "../../src/entities/models/BidderActivity";
import {
  initializeBidderActivity,
  parseBidderActivityInitializationArgs,
} from "../../src/infrastructure/repositories/bidder-activity-initialization";

const USAGE = `Usage: npm run bidders:activity -- --branch-id ID [--apply] [--batch-size 200]
       npm run bidders:activity -- --all-branches [--apply] [--batch-size 200]

Preview is the default. --apply only initializes missing timestamps.
Neither mode changes bidder status or updated_at.
Use a full checkout with the matching schema migration already applied.
Review the database destination before using --apply.`;

async function main() {
  const options = parseBidderActivityInitializationArgs(process.argv.slice(2));
  if (!options) {
    console.log(USAGE);
    return;
  }

  const now = new Date();
  console.log(options.apply ? "Mode: initialize missing timestamps" : "Mode: read-only preview");
  console.log(`Scope: ${options.branch_id ?? "all branches (explicit)"}`);
  console.log(`Preview time: ${now.toISOString()}`);
  console.log(`Six-month cutoff: ${getBidderActivityCutoff(now).toISOString()}`);
  console.log("Historical timestamps are estimates. Hard-deleted activity cannot always be recovered.");
  console.log("Existing last_activity_at values are authoritative and remain unchanged.");

  const prisma = new PrismaClient();
  try {
    const summaries = await initializeBidderActivity(prisma, options, now);
    console.table(summaries);
    console.log("Status-change columns are a preview only. No bidder statuses changed.");
    if (summaries.some((summary) => summary.future_activity > 0)) {
      console.log("Future activity timestamps need review before automation is enabled.");
    }
    if (!summaries.length) console.log("No eligible bidders found in this scope.");
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  // Prisma errors can include connection details. Do not print them in operator logs.
  if (error instanceof Error && error.name === "Error") console.error(error.message);
  else console.error("Database initialization failed. Check migration, access, and connectivity privately.");
  console.error("No bidder statuses changed. Earlier timestamp batches may have committed in apply mode.");
  process.exitCode = 1;
});
