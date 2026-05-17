import { getBidders } from "@/app/(protected)/bidders/actions";
import Link from "next/link";
import { Users } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Card } from "@/app/components/ui/card";
import { ErrorComponent } from "@/app/components/ErrorComponent";
import { PageContainer } from "@/app/components/PageContainer";
import { PageHeader } from "@/app/components/PageHeader";
import { BiddersTable } from "@/app/(protected)/bidders/components/bidders-table";
import { UploadBiddersModal } from "./components/UploadBiddersModal";
import { requireSession } from "@/app/lib/auth";

export default async function Page() {
  const res = await getBidders();
  const session = await requireSession();

  if (!res.ok) {
    return <ErrorComponent error={res.error} />;
  }

  const bidders = res.value;
  const user = session.user;
  const canUpload = ["OWNER", "SUPER_ADMIN"].includes(user.role);

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

      <Card className="flex flex-col p-3.5 2xl:p-5 2xl:text-[15px]">
        <div className="mb-3 flex items-center gap-2">
          <Users size={14} className="text-muted-foreground" />
          <span className="text-[13.5px] font-semibold 2xl:text-[17.5px]">
            All Bidders
          </span>
          <span className="ml-auto text-[11px] text-muted-foreground 2xl:text-[15px]">
            {bidders.length.toLocaleString()} total
          </span>
        </div>

        <BiddersTable bidders={bidders} />
      </Card>
    </PageContainer>
  );
}
