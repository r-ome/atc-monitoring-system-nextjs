import { getAuction } from "@/app/(protected)/auctions/actions";
import { RegisterBidderModal } from "@/app/(protected)/auctions/components/RegisterBidderModal";
import { RegisteredBiddersTable } from "../../components/RegisteredBiddersTable";
import { ErrorComponent } from "@/app/components/ErrorComponent";

export default async function Page({
  params,
}: Readonly<{ params: { auction_date: string } }>) {
  const { auction_date } = await params;
  const res = await getAuction(auction_date);

  if (!res.ok) {
    return <ErrorComponent error={res.error} />;
  }
  const auction = res.value;

  return (
    <div className="flex flex-col gap-2">
      <div className="w-1/6">
        <RegisterBidderModal
          auction={auction}
          registeredBidders={auction.registered_bidders}
        />
      </div>

      <RegisteredBiddersTable registeredBidders={auction.registered_bidders} />
    </div>
  );
}
