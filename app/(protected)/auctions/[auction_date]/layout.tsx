import { AuctionBreadcrumb } from "./AuctionBreadcrumb";

export default async function AuctionDateLayout({
  children,
  params,
}: Readonly<{ children: React.ReactNode; params: Promise<{ auction_date: string }> }>) {
  const { auction_date } = await params;

  return (
    <>
      <AuctionBreadcrumb auctionDate={auction_date} />
      {children}
    </>
  );
}
