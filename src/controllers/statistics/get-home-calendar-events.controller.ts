import { formatDate } from "@/app/lib/utils";
import { logger } from "@/app/lib/logger";
import { DatabaseOperationError } from "src/entities/errors/common";
import { err, ok } from "src/entities/models/Result";
import {
  HomeCalendarAuctionEvent,
  HomeCalendarBidderBirthdayEvent,
  HomeCalendarContainerDueEvent,
} from "src/entities/models/Statistics";
import { StatisticsRepository } from "src/infrastructure/di/repositories";
import { AuctionsStatisticsRow } from "src/entities/models/Statistics";
import { ContainerWithBranchRow } from "src/entities/models/Container";
import { BiddersWithBirthdatesAndRecentAuctionSchema } from "src/entities/models/Bidder";

const EVENT_COLORS = {
  AUCTION: {
    backgroundColor: "#2563eb",
    borderColor: "#1d4ed8",
    textColor: "#ffffff",
  },
  CONTAINER_DUE: {
    backgroundColor: "#16a34a",
    borderColor: "#15803d",
    textColor: "#ffffff",
  },
  BIDDER_BIRTHDAY: {
    backgroundColor: "#facc15",
    borderColor: "#eab308",
    textColor: "#1f2937",
  },
} as const;

function presentAuctions(
  auctions: AuctionsStatisticsRow[],
): HomeCalendarAuctionEvent[] {
  return auctions.map((auction) => ({
    id: `auction-${auction.auction_id}`,
    title: "Auction",
    start: formatDate(auction.auction_date, "yyyy-MM-dd"),
    allDay: true,
    event_type: "AUCTION",
    ...EVENT_COLORS.AUCTION,
    details: {
      auction_id: auction.auction_id,
      auction_date: formatDate(auction.auction_date, "MMMM dd, yyyy"),
      total_registered_bidders: Number(auction.total_registered_bidders),
      total_items: Number(auction.total_items),
      total_cancelled_items: Number(auction.total_cancelled_items),
      total_refunded_items: Number(auction.total_refunded_items),
      total_bidders_with_balance: Number(auction.total_bidders_with_balance),
      container_barcodes: auction.container_barcodes ?? "",
      route_path: `/auctions/${formatDate(auction.auction_date, "yyyy-MM-dd")}`,
    },
  }));
}

function presentContainers(
  containers: ContainerWithBranchRow[],
): HomeCalendarContainerDueEvent[] {
  return containers.flatMap((container) => {
    if (!container.due_date) {
      return [];
    }

    return [
      {
        id: `container-${container.container_id}`,
        title: `🚚 ${container.barcode}`,
        start: formatDate(new Date(container.due_date), "yyyy-MM-dd"),
        allDay: true,
        event_type: "CONTAINER_DUE",
        ...EVENT_COLORS.CONTAINER_DUE,
        details: {
          container_id: container.container_id,
          barcode: container.barcode,
          bill_of_lading_number: container.bill_of_lading_number ?? "",
          container_number: container.container_number ?? "",
          arrival_date: container.arrival_date
            ? formatDate(new Date(container.arrival_date), "MMM d, yyyy")
            : "N/A",
          due_date: formatDate(new Date(container.due_date), "MMM d, yyyy"),
          branch_name: container.branch.name ?? "N/A",
          route_path: `/containers/${container.barcode}`,
        },
      },
    ];
  });
}

function presentBidderBirthdays(
  bidders: BiddersWithBirthdatesAndRecentAuctionSchema[],
): HomeCalendarBidderBirthdayEvent[] {
  const currentYear = formatDate(new Date(), "yyyy");

  return bidders.map((bidder) => {
    const birthdate = new Date(bidder.birthdate);
    return {
      id: `birthday-${bidder.bidder_id}`,
      title: `🎂 ${bidder.first_name} ${bidder.last_name}`,
      start: `${currentYear}-${formatDate(birthdate, "MM-dd")}`,
      allDay: true,
      event_type: "BIDDER_BIRTHDAY",
      ...EVENT_COLORS.BIDDER_BIRTHDAY,
      details: {
        bidder_id: bidder.bidder_id,
        bidder_number: bidder.bidder_number,
        full_name: `${bidder.first_name} ${bidder.last_name}`,
        birthdate: formatDate(birthdate, "MMM d"),
        age: bidder.age,
        last_auction_date: bidder.last_auction_date
          ? formatDate(new Date(bidder.last_auction_date), "MMM d, yyyy")
          : "N/A",
        route_path: `/bidders/${bidder.bidder_number}`,
      },
    };
  });
}

export const GetHomeCalendarEventsController = async () => {
  try {
    const [auctions, containers, bidderBirthdates] = await Promise.all([
      StatisticsRepository.getAuctionsStatistics(),
      StatisticsRepository.getContainersDueDate(),
      StatisticsRepository.getBidderBirthdates(),
    ]);

    return ok([
      ...presentAuctions(auctions),
      ...presentContainers(containers),
      ...presentBidderBirthdays(bidderBirthdates),
    ]);
  } catch (error) {
    logger("GetHomeCalendarEventsController", error);
    if (error instanceof DatabaseOperationError) {
      return err({ message: "Server Error", cause: error.message });
    }
    return err({
      message: "An error occurred! Please contact your admin!",
      cause: "Server Error",
    });
  }
};
