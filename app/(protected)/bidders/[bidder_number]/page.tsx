import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { redirect } from "next/navigation";
import { getBidderByBidderNumber } from "@/app/(protected)/bidders/actions";
import { Card } from "@/app/components/ui/card";
import { PageContainer } from "@/app/components/PageContainer";
import { BranchBadge, StatusBadge } from "@/app/components/admin";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/app/components/ui/tooltip";
import { ErrorComponent } from "@/app/components/ErrorComponent";
import { UpdateBidderModal } from "./UpdateBidderModal";
import { PrintBidderNumber } from "./components/PrintBidderNumber";
import AuctionsJoined from "./components/AuctionsJoinedTable";
import BidderRequirementsTable from "./components/BidderRequirementsTable";
import BidderBanHistoriesTable from "./components/BidderBanHistoriesTable";

export default async function Page({
  params,
}: Readonly<{ params: Promise<{ bidder_number: string }> }>) {
  const { bidder_number } = await params;

  const res = await getBidderByBidderNumber(bidder_number);

  if (!res.ok) {
    return <ErrorComponent error={res.error} />;
  }

  const bidder = res.value;

  if (!bidder) {
    return redirect("/bidders");
  }

  const stats: { label: string; value: string }[] = [
    { label: "Service Charge", value: `${bidder.service_charge}%` },
    {
      label: "Registration Fee",
      value: `₱${bidder.registration_fee.toLocaleString()}`,
    },
    { label: "Joined at", value: bidder.created_at },
    { label: "Contact Number", value: bidder.contact_number || "—" },
    { label: "Birth Date", value: bidder.birthdate || "—" },
  ];

  const profileRows: { label: React.ReactNode; value: React.ReactNode }[] = [
    { label: "Full Name", value: bidder.full_name },
    { label: "Address", value: bidder.address || "—" },
    { label: "TIN Number", value: bidder.tin_number || "—" },
    { label: "Store Name", value: bidder.store_name || "—" },
    {
      label: (
        <Tooltip>
          <TooltipTrigger className="underline-offset-2 hover:underline">
            Payment Term
          </TooltipTrigger>
          <TooltipContent side="right" className="max-w-60">
            Number of days that bidder can pay their items before they can
            register in a new auction.
          </TooltipContent>
        </Tooltip>
      ),
      value: `${bidder.payment_term} days`,
    },
  ];

  return (
    <PageContainer>
      <nav className="flex items-center gap-1.5 text-[12px] text-muted-foreground 2xl:text-[14px]">
        <Link href="/bidders" className="hover:text-foreground">
          Bidders
        </Link>
        <ChevronRight size={12} className="opacity-60" />
        <span className="font-medium text-foreground">
          {bidder.bidder_number}
        </span>
      </nav>

      <Card className="flex flex-row flex-wrap items-center justify-between gap-4 p-4 sm:gap-6 sm:p-5 2xl:p-6">
        <div className="flex min-w-0 flex-col gap-1.5">
          <div className="flex flex-wrap items-center gap-2.5">
            {bidder.branch?.name ? (
              <BranchBadge branch={bidder.branch.name} />
            ) : null}
            <StatusBadge
              variant={
                ["INACTIVE", "BANNED"].includes(bidder.status)
                  ? "inactive"
                  : "active"
              }
            >
              {bidder.status}
            </StatusBadge>
          </div>
          <h1 className="truncate text-[18px] font-semibold tracking-tight sm:text-[22px] 2xl:text-[28px]">
            Bidder #{bidder.bidder_number}
          </h1>
          <p className="truncate text-[13px] text-muted-foreground 2xl:text-[15px]">
            {bidder.full_name}
          </p>
        </div>
        <div className="grid w-full grid-cols-2 gap-2 [&>*]:w-full [&>*]:min-w-0 [&_button]:w-full sm:flex sm:w-auto sm:[&>*]:w-auto sm:[&_button]:w-auto">
          <UpdateBidderModal bidder={bidder} />
          <PrintBidderNumber bidder={bidder} />
        </div>
      </Card>

      <Card className="p-0">
        <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-lg bg-border sm:grid-cols-3 lg:grid-cols-5">
          {stats.map((s) => (
            <div
              key={s.label}
              className="flex flex-col gap-0.5 bg-card px-4 py-3 sm:px-5 sm:py-4"
            >
              <dt className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground 2xl:text-[12.5px]">
                {s.label}
              </dt>
              <dd className="text-[14px] font-semibold text-foreground 2xl:text-[16px]">
                {s.value}
              </dd>
            </div>
          ))}
        </dl>
      </Card>

      <Card className="p-0">
        <dl className="divide-y">
          {profileRows.map((row, i) => (
            <div
              key={i}
              className="flex flex-col gap-1 px-4 py-3 sm:grid sm:grid-cols-[200px_1fr] sm:items-center sm:gap-4 sm:px-6 sm:py-3.5"
            >
              <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground sm:text-[12px]">
                {row.label}
              </dt>
              <dd className="text-[14px] text-foreground sm:text-[15px]">
                {row.value}
              </dd>
            </div>
          ))}
        </dl>
      </Card>

      <AuctionsJoined
        auctionsJoined={bidder.auctions_joined}
        bidderNumber={bidder.bidder_number}
      />

      <BidderRequirementsTable
        bidder_id={bidder.bidder_id}
        requirements={bidder.requirements}
      />

      <BidderBanHistoriesTable
        bidder_id={bidder.bidder_id}
        bidder_status={bidder.status}
        ban_histories={bidder.ban_histories}
      />
    </PageContainer>
  );
}
