export const dynamic = "force-dynamic";

import { requireSession } from "@/app/lib/auth";
import { SessionActivityWatcher } from "./SessionActivityWatcher";
import { AuctionItemSearchOverlay } from "@/app/(protected)/auctions/[auction_date]/AuctionItemSearchOverlay";
import { RailNav } from "@/app/components/rail/RailNav";
import { AppHeader } from "@/app/components/header/AppHeader";

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireSession();

  return (
    <div className="flex h-screen overflow-hidden">
      <SessionActivityWatcher
        initialLastActivityAt={session.user.lastActivityAt ?? null}
      />
      <AuctionItemSearchOverlay />
      <RailNav session={session} />

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <AppHeader session={session} />
        <main className="flex-1 overflow-y-auto bg-background p-4 pb-20 md:p-6 md:pb-6 2xl:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
