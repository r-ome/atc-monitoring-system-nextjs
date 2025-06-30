import {
  getAuction,
  getManifestRecords,
} from "@/app/(protected)/auctions/actions";
import { ManifestRecordsTable } from "@/app/(protected)/auctions/[auction_date]/manifest/ManifestRecordsTable";
import { ErrorComponent } from "@/app/components/ErrorComponent";

export default async function Page({
  params,
}: Readonly<{ params: { auction_date: string } }>) {
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

  return <ManifestRecordsTable manifestRecords={manifest_records} />;
}
