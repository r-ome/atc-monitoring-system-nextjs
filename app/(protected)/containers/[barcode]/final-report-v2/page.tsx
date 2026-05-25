import { getContainerByBarcode } from "@/app/(protected)/containers/actions";
import { ErrorComponent } from "@/app/components/ErrorComponent";
import { V2Wizard } from "./V2Wizard";

export default async function Page({
  params,
}: Readonly<{ params: Promise<{ barcode: string }> }>) {
  const { barcode } = await params;
  const res = await getContainerByBarcode(barcode);

  if (!res.ok) {
    return <ErrorComponent error={res.error} />;
  }

  const container = res.value;
  const auctionDates = Array.from(
    new Set(
      container.inventories
        .filter((item) => item.auctions_inventory && item.auction_date)
        .map((item) => item.auction_date as string),
    ),
  );

  const breakdownInventories = container.inventories.map((inv) => ({
    auction_date: inv.auction_date,
    sales_allocation: inv.sales_allocation,
    auctions_inventory: inv.auctions_inventory
      ? {
          status: inv.auctions_inventory.status,
          price: inv.auctions_inventory.price,
          bidder: inv.auctions_inventory.bidder
            ? {
                bidder_number: inv.auctions_inventory.bidder.bidder_number,
              }
            : null,
        }
      : null,
  }));

  return (
    <V2Wizard
      container={{
        container_id: container.container_id,
        barcode: container.barcode,
        supplier: {
          name: container.supplier.name,
          sales_remittance_account:
            container.supplier.sales_remittance_account ?? "",
        },
        branch_name: container.branch?.name ?? null,
        duties_and_taxes: container.duties_and_taxes ?? 0,
        arrival_date: container.arrival_date ?? "",
        bill_of_lading_number: container.bill_of_lading_number ?? "",
        due_date: container.due_date ?? "",
      }}
      auctionDates={auctionDates}
      breakdownInventories={breakdownInventories}
    />
  );
}
