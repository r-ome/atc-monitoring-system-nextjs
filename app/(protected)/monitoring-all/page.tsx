export const dynamic = "force-dynamic";

import { getMonitoring } from "@/app/(protected)/auctions/actions";
import { MonitoringTable } from "@/app/(protected)/auctions/[auction_date]/monitoring/MonitoringTable";
import { ErrorComponent } from "@/app/components/ErrorComponent";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";

export default async function Page() {
  const session = await getServerSession(authOptions);
  if (!session) return;
  const monitoring_res = await getMonitoring("ALL");

  if (!monitoring_res.ok) {
    return <ErrorComponent error={monitoring_res.error} />;
  }

  const monitoring = monitoring_res.value;

  return (
    <div className="flex flex-col gap-2">
      <MonitoringTable monitoring={monitoring} isMasterList={true} />
    </div>
  );
}
