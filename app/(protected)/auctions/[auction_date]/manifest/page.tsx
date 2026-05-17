import {
  getAuction,
  getManifestRecords,
} from "@/app/(protected)/auctions/actions";
import { ManifestRecordsTable } from "@/app/(protected)/auctions/[auction_date]/manifest/ManifestRecordsTable";
import { UploadManifestModal } from "@/app/(protected)/auctions/[auction_date]/monitoring/components/UploadManifestModal";
import { AuctionSectionNav } from "@/app/(protected)/auctions/components/AuctionSectionNav";
import { AuctionSecondaryHeader } from "@/app/(protected)/auctions/components/AuctionSecondaryHeader";
import { ErrorComponent } from "@/app/components/ErrorComponent";
import { PageContainer } from "@/app/components/PageContainer";
import { requireUser } from "@/app/lib/auth";

export default async function Page({
  params,
}: Readonly<{ params: Promise<{ auction_date: string }> }>) {
  const { auction_date } = await params;
  const auction_res = await getAuction(auction_date);

  if (!auction_res.ok) {
    return <ErrorComponent error={auction_res.error} />;
  }

  const auction = auction_res.value;
  const manifest_res = await getManifestRecords(auction.auction_id);
  const user = await requireUser();

  if (!manifest_res.ok) {
    return <ErrorComponent error={manifest_res.error} />;
  }

  const manifest_records = manifest_res.value;

  return (
    <PageContainer>
      <AuctionSecondaryHeader
        auctionDate={auction_date}
        branchName={auction.branch.name}
        startedAt={auction.started_at}
        actions={<UploadManifestModal auction_id={auction.auction_id} />}
      />

      <AuctionSectionNav basePath={`/auctions/${auction_date}`} />

      <ManifestRecordsTable
        manifestRecords={manifest_records}
        canDeleteFailedRecords={user.role === "SUPER_ADMIN"}
      />
    </PageContainer>
  );
}
