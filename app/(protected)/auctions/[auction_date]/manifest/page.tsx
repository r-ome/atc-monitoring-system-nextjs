import {
  getAuction,
  getManifestRecords,
} from "@/app/(protected)/auctions/actions";
import { ManifestRecordsTable } from "@/app/(protected)/auctions/[auction_date]/manifest/ManifestRecordsTable";
import { ErrorComponent } from "@/app/components/ErrorComponent";
import { UploadManifestModal } from "@/app/(protected)/auctions/[auction_date]/monitoring/components/UploadManifestModal";

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

  if (!manifest_res.ok) {
    return <ErrorComponent error={manifest_res.error} />;
  }

  const manifest_records = manifest_res.value;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-4">
        <UploadManifestModal auction_id={auction.auction_id} />
      </div>
      <ManifestRecordsTable manifestRecords={manifest_records} />
    </div>
  );
}
