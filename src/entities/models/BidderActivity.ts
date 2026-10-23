import { getTimezoneOffset } from "date-fns-tz";

const BIDDER_ACTIVITY_TIME_ZONE = "Asia/Manila";
const MANILA_CALENDAR_FORMAT = new Intl.DateTimeFormat("en-US", {
  timeZone: BIDDER_ACTIVITY_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
});

export type BidderActivityRecalculation = {
  activated: number;
  deactivated: number;
  cutoff: string;
};

export function getBidderActivityTime(now = new Date()): Date {
  if (!Number.isFinite(now.getTime())) throw new Error("Invalid bidder activity time.");
  return new Date(Math.floor(now.getTime() / 1000) * 1000);
}

/** Six calendar months ago in Manila, clamped at month end and to whole seconds. */
export function getBidderActivityCutoff(now: Date): Date {
  if (!Number.isFinite(now.getTime())) {
    throw new Error("A valid current time is required for bidder activity.");
  }

  const parts = Object.fromEntries(MANILA_CALENDAR_FORMAT.formatToParts(now)
    .filter((part) => part.type !== "literal")
    .map((part) => [part.type, Number(part.value)]));
  const { year, month, day, hour, minute, second } = parts;
  const targetMonth = month - 1 - 6;
  const lastDay = new Date(Date.UTC(year, targetMonth + 1, 0)).getUTCDate();

  // Work with UTC components so the host's daylight-saving transitions cannot
  // alter the Manila calendar arithmetic. This date is a wall-clock surrogate.
  const calendarDate = new Date(Date.UTC(
    year, targetMonth, Math.min(day, lastDay), hour, minute, second,
  ));

  return new Date(calendarDate.getTime() - getTimezoneOffset(BIDDER_ACTIVITY_TIME_ZONE, calendarDate));
}
