export const dynamic = "force-dynamic";

import { formatDate } from "@/app/lib/utils";
import { getAuction, getMonitoring } from "@/app/(protected)/auctions/actions";
import { AuctionNavigation } from "@/app/(protected)/auctions/components/AuctionNavigation";
import {
  Card,
  CardHeader,
  CardContent,
  CardTitle,
} from "@/app/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/app/components/ui/table";
import { cn } from "@/app/lib/utils";
import { StartAuctionButton } from "../components/StartAuctionButton";
import { requireSession } from "@/app/lib/auth";
import { AuctionContainerSummaryTable } from "../components/AuctionContainerSummaryTable";
import { PageHeader, StatCard, StatCardGroup } from "@/app/components/admin";
import { Users, DollarSign, TrendingUp, AlertCircle } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/app/components/ui/alert";
import { ErrorComponent } from "@/app/components/ErrorComponent";

export default async function Page({
  params,
}: Readonly<{ params: Promise<{ auction_date: string }> }>) {
  const session = await requireSession();
  const { auction_date } = await params;
  const res = await getAuction(auction_date);

  if (!res.ok) {
    if (res.error.message === "Auction not found!")
      return (
        <div className="h-40 flex items-center justify-center">
          <div className="w-full max-w-md">
            <Alert>
              <AlertCircle className="size-4" />
              <AlertTitle>No Auction on this day.</AlertTitle>
              <AlertDescription>
                If you want, you can start an auction today!
              </AlertDescription>
            </Alert>
            {!["ENCODER", "MODERATOR"].includes(session.user.role) && (
              <div className="mt-4 flex justify-center">
                <StartAuctionButton />
              </div>
            )}
          </div>
        </div>
      );

    return <ErrorComponent error={res.error} />;
  }

  const auction = res.value;
  const monitoringRes = await getMonitoring(auction.auction_id);

  if (!monitoringRes.ok) {
    return <ErrorComponent error={monitoringRes.error} />;
  }

  const total_registered_bidders = auction.registered_bidders.length - 1;
  const total_registration_fee = auction.registered_bidders.reduce(
    (acc, item) => (acc += item.registration_fee),
    0,
  );

  const item_summary = monitoringRes.value.reduce(
    (acc, item) => {
      const has_refunded_history = item.histories.some((history) =>
        history.remarks?.startsWith("Refunded item"),
      );
      const is_refunded = item.status === "REFUNDED" || has_refunded_history;

      acc.total_items += 1;
      if (item.status === "PAID") acc.paid_items += 1;
      if (item.status === "UNPAID") acc.unpaid_items += 1;
      if (item.status === "CANCELLED" && !is_refunded) acc.cancelled_items += 1;
      if (is_refunded) acc.refunded_items += 1;
      if (["PAID", "UNPAID"].includes(item.status)) {
        acc.total_item_price += item.price;
      }

      return acc;
    },
    {
      total_items: 0,
      paid_items: 0,
      unpaid_items: 0,
      cancelled_items: 0,
      refunded_items: 0,
      total_item_price: 0,
    },
  );
  const payable_item_count =
    item_summary.paid_items + item_summary.unpaid_items;
  const paid_item_percentage = payable_item_count
    ? Math.round((item_summary.paid_items / payable_item_count) * 100)
    : 0;
  const unpaid_item_percentage = payable_item_count
    ? Math.round((item_summary.unpaid_items / payable_item_count) * 100)
    : 0;

  const total_service_charge_amount = auction.registered_bidders.reduce(
    (acc, registered_bidder) => {
      const total_item_price = registered_bidder.auction_inventories
        .filter((item) => ["PAID", "UNPAID"].includes(item.status))
        .reduce((acc, item) => (acc += item.price), 0);
      const service_charge_amount =
        (registered_bidder.service_charge * total_item_price) / 100;
      return (acc += service_charge_amount);
    },
    0,
  );

  const auction_container = auction.auctions_inventories.reduce(
    (acc, ai) => {
      const key = ai.inventory.container.barcode;

      if (!acc[key]) {
        acc[key] = [];
      }

      acc[key].push(ai);
      return acc;
    },
    {} as Record<string, typeof auction.auctions_inventories>,
  );

  const container_summary = Object.keys(auction_container)
    .map((item) => ({
      barcode: item,
      total_items: auction_container[item]?.length ?? 0,
      total_sale:
        auction_container[item]?.reduce((acc, ac) => {
          acc += ac.price;
          return acc;
        }, 0) ?? 0,
    }))
    .sort((a, b) => b.total_sale - a.total_sale);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={formatDate(new Date(auction_date), "EEEE, MMMM dd, yyyy")}
      />

      {session.user.role !== "MODERATOR" ? <AuctionNavigation /> : null}

      <div
        className={cn(
          "flex flex-col gap-6",
          session.user.role === "ENCODER" && "hidden",
          session.user.role === "MODERATOR" && "show",
        )}
      >
        <StatCardGroup columns={3}>
          <StatCard
            title="Registered Bidders"
            value={total_registered_bidders}
            description="Total Registered Bidders"
            icon={Users}
            variant="default"
            contentClassName="py-0"
          />
          <StatCard
            title="Total Registration Fee"
            value={`₱${total_registration_fee.toLocaleString()}`}
            description="Total Registration Fee"
            icon={DollarSign}
            variant="primary"
            contentClassName="py-0"
          />
          <StatCard
            title="Total Sales"
            value={`₱${item_summary.total_item_price.toLocaleString()}`}
            description={`₱${total_service_charge_amount.toLocaleString()} Service Charge Amount`}
            icon={TrendingUp}
            variant="success"
            contentClassName="py-0"
          />
        </StatCardGroup>

        <div className="grid gap-6 lg:grid-cols-[1fr_auto]">
          <AuctionContainerSummaryTable
            containerSummary={container_summary}
          />

          {/* Item Summary */}
          <Card className="h-fit">
            <CardHeader className="pb-3">
              <CardTitle>Item Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between gap-8">
                  <p className="text-sm text-muted-foreground uppercase">Total Items</p>
                  <p className="text-2xl font-bold">{item_summary.total_items}</p>
                </div>
                <div className="flex flex-col gap-2">
                  <div className="h-3 w-full overflow-hidden rounded-full bg-status-error/20">
                    <div
                      className="h-full rounded-full bg-status-success"
                      style={{ width: `${paid_item_percentage}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Paid {paid_item_percentage}%</span>
                    <span>Unpaid {unpaid_item_percentage}%</span>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-8">
                  <p className="text-sm text-muted-foreground uppercase">Paid</p>
                  <p className="text-2xl font-bold text-status-success">{item_summary.paid_items}</p>
                </div>
                <div className="flex items-center justify-between gap-8">
                  <p className="text-sm text-muted-foreground uppercase">Unpaid</p>
                  <p className="text-2xl font-bold text-status-error">{item_summary.unpaid_items}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
