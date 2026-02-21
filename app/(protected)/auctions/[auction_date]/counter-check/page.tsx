export const dynamic = "force-dynamic";

import {
  getAuction,
  getCounterCheck,
} from "@/app/(protected)/auctions/actions";
import { ErrorComponent } from "@/app/components/ErrorComponent";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import { redirect } from "next/navigation";
import { UploadCounterCheckModal } from "./components/UploadCounterCheckModal";
import { CounterCheckTable } from "./CounterCheckTable";

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
  const counter_check_res = await getCounterCheck(auction.auction_id);

  if (!counter_check_res.ok) {
    return <ErrorComponent error={counter_check_res.error} />;
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-4">
        <UploadCounterCheckModal auction_id={auction.auction_id} />
        {/* {session.user.role !== "ENCODER" && (
          <GenerateReportButton monitoring={monitoring} />
        )} */}
      </div>
      <CounterCheckTable counterCheck={counter_check_res.value} />
    </div>
  );
}
