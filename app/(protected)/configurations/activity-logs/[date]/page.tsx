import { redirect } from "next/navigation";
import { requireSession } from "@/app/lib/auth";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/app/components/ui/card";
import { ErrorComponent } from "@/app/components/ErrorComponent";
import { getActivityLogs } from "../actions";
import { ActivityLogsTable } from "./components/ActivityLogsTable";
import { AuctionItemSearchOverlay } from "@/app/(protected)/auctions/[auction_date]/AuctionItemSearchOverlay";

export default async function Page({
  params,
}: Readonly<{ params: Promise<{ date: string }> }>) {
  const { date } = await params;
  const session = await requireSession();
  if (!["SUPER_ADMIN", "OWNER"].includes(session.user.role))
    redirect("/configurations");

  const res = await getActivityLogs(date);

  if (!res.ok) {
    return <ErrorComponent error={res.error} />;
  }

  return (
    <>
      <AuctionItemSearchOverlay />
      <Card>
        <CardHeader>
          <CardTitle>Activity Logs</CardTitle>
          <CardDescription>{date}</CardDescription>
        </CardHeader>
        <CardContent>
          <ActivityLogsTable logs={res.value} />
        </CardContent>
      </Card>
    </>
  );
}
