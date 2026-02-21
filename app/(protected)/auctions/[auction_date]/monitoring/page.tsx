export const dynamic = "force-dynamic";

import {
  getAuction,
  getCounterCheck,
  getMonitoring,
} from "@/app/(protected)/auctions/actions";
import { MonitoringTable } from "./MonitoringTable";
import { GenerateReportButton } from "./components/GenerateReport";
import { AddOnModal } from "./components/AddOnModal";
import { ErrorComponent } from "@/app/components/ErrorComponent";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import { redirect } from "next/navigation";

export default async function Page({
  params,
}: Readonly<{ params: Promise<{ auction_date: string }> }>) {
  const { auction_date } = await params;
  const auction_res = await getAuction(auction_date);
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  if (!auction_res.ok) {
    return <ErrorComponent error={auction_res.error} />;
  }

  const auction = auction_res.value;
  const monitoring_res = await getMonitoring(auction.auction_id);
  const counter_check_res = await getCounterCheck(auction.auction_id);

  if (!monitoring_res.ok) {
    return <ErrorComponent error={monitoring_res.error} />;
  }

  if (!counter_check_res.ok) {
    return <ErrorComponent error={counter_check_res.error} />;
  }

  const monitoring = monitoring_res.value;
  const counter_check = counter_check_res.value;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-4">
        {session.user.role !== "ENCODER" && (
          <GenerateReportButton monitoring={monitoring} />
        )}
        <AddOnModal
          auction_id={auction.auction_id}
          registered_bidders={auction.registered_bidders}
        />
      </div>
      <MonitoringTable monitoring={monitoring} counterCheck={counter_check} />
    </div>
  );
}
