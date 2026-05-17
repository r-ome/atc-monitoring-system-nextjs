export const dynamic = "force-dynamic";

import { getMonitoring } from "@/app/(protected)/auctions/actions";
import { MonitoringTable } from "@/app/(protected)/auctions/[auction_date]/monitoring/MonitoringTable";
import { ErrorComponent } from "@/app/components/ErrorComponent";
import { PageContainer } from "@/app/components/PageContainer";
import { PageHeader } from "@/app/components/PageHeader";
import { requireSession } from "@/app/lib/auth";

export default async function Page() {
  await requireSession();
  const monitoring_res = await getMonitoring("ALL");

  if (!monitoring_res.ok) {
    return <ErrorComponent error={monitoring_res.error} />;
  }

  const monitoring = monitoring_res.value;

  return (
    <PageContainer>
      <PageHeader
        title="Monitoring · Master List"
        subtitle="All auction items across the branch"
      />

      <MonitoringTable monitoring={monitoring} isMasterList={true} />
    </PageContainer>
  );
}
