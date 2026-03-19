import {
  getAuctionId,
  getRegisteredBiddersSummary,
} from "@/app/(protected)/auctions/actions";
import { RegisterBidderModal } from "@/app/(protected)/auctions/components/RegisterBidderModal";
import { RegisteredBiddersTable } from "../../components/RegisteredBiddersTable";
import { ErrorComponent } from "@/app/components/ErrorComponent";

export default async function Page({
  params,
}: Readonly<{ params: Promise<{ auction_date: string }> }>) {
  const { auction_date } = await params;

  const auctionRes = await getAuctionId(auction_date);
  if (!auctionRes.ok) {
    return <ErrorComponent error={auctionRes.error} />;
  }

  const biddersRes = await getRegisteredBiddersSummary(auctionRes.value);
  if (!biddersRes.ok) {
    return <ErrorComponent error={biddersRes.error} />;
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="w-1/6">
        <RegisterBidderModal
          auction_id={auctionRes.value}
          registeredBidders={biddersRes.value}
        />
      </div>

      <RegisteredBiddersTable registeredBidders={biddersRes.value} />
    </div>
  );
}
