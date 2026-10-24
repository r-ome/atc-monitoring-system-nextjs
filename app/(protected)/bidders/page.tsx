import { getBidders } from "@/app/(protected)/bidders/actions";
import Link from "next/link";
import { Button } from "@/app/components/ui/button";
import { ErrorComponent } from "@/app/components/ErrorComponent";
import { PageContainer } from "@/app/components/PageContainer";
import { PageHeader } from "@/app/components/PageHeader";
import { BidderStatusBoard } from "@/app/(protected)/bidders/components/BidderStatusBoard";
import { UploadBiddersModal } from "./components/UploadBiddersModal";
import { requireSession } from "@/app/lib/auth";
import { SUPER_ADMIN_BRANCH } from "@/app/lib/prisma/prisma";
import { RecalculateBidderStatusesButton } from "./components/RecalculateBidderStatusesButton";

type Status = "ACTIVE" | "INACTIVE" | "BANNED";

export default async function Page() {
  const res = await getBidders();
  const session = await requireSession();

  if (!res.ok) {
    return <ErrorComponent error={res.error} />;
  }

  const bidders = res.value;
  const user = session.user;
  const canUpload = ["OWNER", "SUPER_ADMIN"].includes(user.role);
  const canViewAll = ["OWNER", "SUPER_ADMIN"].includes(user.role);
  const canRecalculate = ["OWNER", "SUPER_ADMIN", "ADMIN", "CASHIER"].includes(user.role);
  const branches = Array.from(new Map(bidders
    .filter(bidder => bidder.branch.name && bidder.branch.name !== "ALL" && bidder.branch.branch_id !== SUPER_ADMIN_BRANCH)
    .map(bidder => [bidder.branch.branch_id, bidder.branch])).values());

  const branchNames = Array.from(
    new Set(
      bidders
        .map((b) => b.branch.name)
        .filter((name): name is string => !!name),
    ),
  ).sort();

  const countsByStatus = (status: Status) => ({
    total: bidders.filter((b) => b.status === status).length,
    branches: branchNames.map((name) => ({
      name,
      count: bidders.filter(
        (b) => b.status === status && b.branch.name === name,
      ).length,
    })),
  });

  const counts = {
    ACTIVE: countsByStatus("ACTIVE"),
    INACTIVE: countsByStatus("INACTIVE"),
    BANNED: countsByStatus("BANNED"),
  };

  return (
    <PageContainer>
      <PageHeader
        title="Bidders"
        subtitle="Manage bidders, balances, and uploads"
        actions={
          <>
            {canRecalculate && <RecalculateBidderStatusesButton
              branches={branches}
              currentBranchId={user.branch.branch_id}
              canSelectBranch={canViewAll}
            />}
            {canUpload ? <UploadBiddersModal /> : null}
            <Link href="bidders/create">
              <Button>Create Bidder</Button>
            </Link>
          </>
        }
      />

      <BidderStatusBoard
        bidders={bidders}
        canViewAll={canViewAll}
        counts={counts}
      />
    </PageContainer>
  );
}
