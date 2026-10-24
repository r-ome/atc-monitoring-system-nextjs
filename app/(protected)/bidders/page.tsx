import { getBidders } from "@/app/(protected)/bidders/actions";
import Link from "next/link";
import { Button } from "@/app/components/ui/button";
import { ErrorComponent } from "@/app/components/ErrorComponent";
import { PageContainer } from "@/app/components/PageContainer";
import { PageHeader } from "@/app/components/PageHeader";
import { BidderStatusBoard } from "@/app/(protected)/bidders/components/BidderStatusBoard";
import { UploadBiddersModal } from "./components/UploadBiddersModal";
import { requireSession } from "@/app/lib/auth";

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
