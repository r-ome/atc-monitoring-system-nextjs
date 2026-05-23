export const dynamic = "force-dynamic";

import { requireSession } from "@/app/lib/auth";
import { SessionActivityWatcher } from "./SessionActivityWatcher";
import { RouteActivityLogger } from "./RouteActivityLogger";
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
      <RouteActivityLogger />
      <AuctionItemSearchOverlay />
      <RailNav session={session} />

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <AppHeader session={session} />
        <main className="flex-1 overflow-y-auto bg-background p-4 pb-[calc(5.5rem_+_env(safe-area-inset-bottom))] md:p-6 md:pb-6 2xl:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
