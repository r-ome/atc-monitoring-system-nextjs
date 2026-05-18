import { getBidders } from "@/app/(protected)/bidders/actions";
import Link from "next/link";
import { UserCheck, UserMinus, Ban, LucideIcon } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Card } from "@/app/components/ui/card";
import { ErrorComponent } from "@/app/components/ErrorComponent";
import { PageContainer } from "@/app/components/PageContainer";
import { PageHeader } from "@/app/components/PageHeader";
import { BiddersTable } from "@/app/(protected)/bidders/components/bidders-table";
import { UploadBiddersModal } from "./components/UploadBiddersModal";
import { requireSession } from "@/app/lib/auth";
import { cn } from "@/app/lib/utils";

type Status = "ACTIVE" | "INACTIVE" | "BANNED";

const VARIANT_STYLES: Record<
  Status,
  { card: string; label: string; icon: string }
> = {
  ACTIVE: {
    card: "border-status-success/20 bg-status-success/5",
    label: "text-status-success",
    icon: "text-status-success",
  },
  INACTIVE: {
    card: "border-border",
    label: "text-muted-foreground",
    icon: "text-muted-foreground",
  },
  BANNED: {
    card: "border-status-error/20 bg-status-error/5",
    label: "text-status-error",
    icon: "text-status-error",
  },
};

function BidderStatCard({
  title,
  value,
  icon: Icon,
  status,
  branches,
  showBranches,
}: {
  title: string;
  value: number;
  icon: LucideIcon;
  status: Status;
  branches: { name: string; count: number }[];
  showBranches: boolean;
}) {
  const styles = VARIANT_STYLES[status];

  return (
    <Card className={cn("relative min-w-0 overflow-hidden", styles.card)}>
      <div className="px-4 py-4 sm:px-6">
        <div
          className={
            showBranches
              ? "flex flex-col gap-3 sm:grid sm:grid-cols-[1fr_1px_1fr] sm:items-center sm:gap-3.5"
              : "flex flex-col gap-3"
          }
        >
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex items-center gap-1.5">
                <Icon size={11} className={styles.icon} />
                <span
                  className={cn(
                    "text-[10px] font-semibold uppercase tracking-widest 2xl:text-[14px]",
                    styles.label,
                  )}
                >
                  {title}
                </span>
              </div>
              <div
                className={cn(
                  "font-mono text-[22px] font-semibold leading-tight tracking-tight 2xl:text-[26px]",
                  styles.label,
                )}
              >
                {value.toLocaleString()}
              </div>
            </div>
          </div>

          {showBranches && (
            <>
              <div className="hidden h-10 bg-border sm:block" />
              <div className="flex flex-col gap-1">
                {branches.map((b) => (
                  <div key={b.name} className="flex items-baseline gap-1.5">
                    <span className="min-w-[48px] text-[11px] font-semibold tracking-wide 2xl:text-[15px]">
                      {b.name.toUpperCase()}
                    </span>
                    <span className="ml-auto font-mono text-[12px] font-medium 2xl:text-[16px]">
                      {b.count.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </Card>
  );
}

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

  const active = countsByStatus("ACTIVE");
  const inactive = countsByStatus("INACTIVE");
  const banned = countsByStatus("BANNED");

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

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <BidderStatCard
          title="Active Bidders"
          value={active.total}
          icon={UserCheck}
          status="ACTIVE"
          branches={active.branches}
          showBranches={canViewAll}
        />
        <BidderStatCard
          title="Inactive Bidders"
          value={inactive.total}
          icon={UserMinus}
          status="INACTIVE"
          branches={inactive.branches}
          showBranches={canViewAll}
        />
        <BidderStatCard
          title="Banned Bidders"
          value={banned.total}
          icon={Ban}
          status="BANNED"
          branches={banned.branches}
          showBranches={canViewAll}
        />
      </div>

      <BiddersTable bidders={bidders} />
    </PageContainer>
  );
}
