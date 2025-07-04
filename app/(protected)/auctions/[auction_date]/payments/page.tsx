import { getAuction } from "@/app/(protected)/auctions/actions";
import { getAuctionTransactions } from "./actions";
import { AuctionTransactionsTable } from "./AuctionTransactionsTable";
import { ErrorComponent } from "@/app/components/ErrorComponent";

export default async function Page({
  params,
}: Readonly<{ params: Promise<{ auction_date: string }> }>) {
  const { auction_date } = await params;
  const auction_res = await getAuction(auction_date);
  if (!auction_res.ok) {
    return (
      <div>
        <ErrorComponent error={auction_res.error} />
      </div>
    );
  }
  const auction = auction_res.value;
  const transactions_res = await getAuctionTransactions(auction.auction_id);

  if (!transactions_res.ok) {
    return (
      <div>
        <ErrorComponent error={transactions_res.error} />
      </div>
    );
  }

  const transactions = transactions_res.value;

  return (
    <div>
      <AuctionTransactionsTable transactions={transactions} />
    </div>
  );
}
