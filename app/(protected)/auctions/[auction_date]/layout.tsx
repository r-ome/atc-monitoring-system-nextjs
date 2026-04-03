import { AuctionItemSearchOverlay } from "./AuctionItemSearchOverlay";

export default function AuctionDateLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <AuctionItemSearchOverlay />
      {children}
    </>
  );
}
