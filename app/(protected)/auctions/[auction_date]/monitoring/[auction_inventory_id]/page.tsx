"use server";

import { getAuctionItemDetails } from "@/app/(protected)/inventories/actions";
import { AuctionInventoryWrapper } from "./components/AuctionInventoryWrapper";

export default async function Page({
  params,
}: Readonly<{ params: Promise<{ auction_inventory_id: string }> }>) {
  const { auction_inventory_id } = await params;
  const res = await getAuctionItemDetails(auction_inventory_id);

  if (!res.ok) {
    return <div>Error Page</div>;
  }

  const auctions_inventories = res.value;

  return <AuctionInventoryWrapper auctionInventory={auctions_inventories} />;
}
