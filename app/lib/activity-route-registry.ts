type RouteParams = Record<string, string>;

type ActivityRoute = {
  pattern: string;
  description: (params: RouteParams) => string;
};

export type ActivityRouteView = {
  entity_id: string;
  description: string;
  params: RouteParams;
};

export const AUCTION_ITEM_DETAILS_ROUTE_PATTERN =
  "/auctions/[auction_date]/monitoring/[auction_inventory_id]";
export const INVENTORY_DETAILS_ROUTE_PATTERN =
  "/containers/[barcode]/inventories/[inventory_id]";

const ROUTES: ActivityRoute[] = [
  {
    pattern: "/auctions/[auction_date]/registered-bidders/[bidder_number]",
    description: ({ auction_date, bidder_number }) =>
      `Viewed auction > registered bidders > #${bidder_number} for auction ${auction_date}`,
  },
  {
    pattern: "/auctions/[auction_date]/registered-bidders",
    description: ({ auction_date }) =>
      `Viewed auction > registered bidders for auction ${auction_date}`,
  },
  {
    pattern: AUCTION_ITEM_DETAILS_ROUTE_PATTERN,
    description: ({ auction_date }) =>
      `Viewed auction > monitoring > item details for auction ${auction_date}`,
  },
  {
    pattern: "/auctions/[auction_date]/monitoring",
    description: ({ auction_date }) =>
      `Viewed auction > monitoring for auction ${auction_date}`,
  },
  {
    pattern: "/auctions/[auction_date]/counter-check",
    description: ({ auction_date }) =>
      `Viewed auction > counter check for auction ${auction_date}`,
  },
  {
    pattern: "/auctions/[auction_date]/payments/[receipt_number]/receipt",
    description: ({ auction_date, receipt_number }) =>
      `Viewed auction > payments > ${receipt_number} > printable receipt for auction ${auction_date}`,
  },
  {
    pattern: "/auctions/[auction_date]/payments/[receipt_number]",
    description: ({ auction_date, receipt_number }) =>
      `Viewed auction > payments > ${receipt_number} for auction ${auction_date}`,
  },
  {
    pattern: "/auctions/[auction_date]/payments",
    description: ({ auction_date }) =>
      `Viewed auction > payments for auction ${auction_date}`,
  },
  {
    pattern: "/auctions/[auction_date]/manifest",
    description: ({ auction_date }) =>
      `Viewed auction > manifest for auction ${auction_date}`,
  },
  {
    pattern: "/auctions/[auction_date]",
    description: ({ auction_date }) =>
      `Viewed auction > overview for auction ${auction_date}`,
  },
  {
    pattern: INVENTORY_DETAILS_ROUTE_PATTERN,
    description: ({ barcode, inventory_id }) =>
      `Viewed containers > ${barcode} > inventories > ${inventory_id}`,
  },
  {
    pattern: "/containers/[barcode]",
    description: ({ barcode }) => `Viewed containers > ${barcode}`,
  },
  {
    pattern: "/bidders/[bidder_number]",
    description: ({ bidder_number }) => `Viewed bidders > #${bidder_number}`,
  },
  {
    pattern: "/payroll/[payroll_period_id]",
    description: ({ payroll_period_id }) => `Viewed payroll > ${payroll_period_id}`,
  },
  {
    pattern: "/suppliers/[supplier_code]",
    description: ({ supplier_code }) => `Viewed suppliers > ${supplier_code}`,
  },
  {
    pattern: "/transactions/[transaction_date]",
    description: ({ transaction_date }) =>
      `Viewed transactions > ${transaction_date}`,
  },
  {
    pattern: "/configurations/activity-logs/[date]",
    description: ({ date }) =>
      `Viewed configurations > activity logs > ${date}`,
  },
  {
    pattern: "/users/create",
    description: () => "Viewed users > create",
  },
  {
    pattern: "/suppliers/create",
    description: () => "Viewed suppliers > create",
  },
  {
    pattern: "/bidders/create",
    description: () => "Viewed bidders > create",
  },
  {
    pattern: "/configurations/payment-methods/create",
    description: () => "Viewed configurations > payment methods > create",
  },
  {
    pattern: "/configurations/payment-methods",
    description: () => "Viewed configurations > payment methods",
  },
  {
    pattern: "/configurations/activity-logs",
    description: () => "Viewed configurations > activity logs",
  },
  {
    pattern: "/configurations",
    description: () => "Viewed configurations",
  },
  {
    pattern: "/monitoring-all",
    description: () => "Viewed monitoring > all",
  },
  {
    pattern: "/bought-items",
    description: () => "Viewed bought items",
  },
  {
    pattern: "/transactions",
    description: () => "Viewed transactions calendar",
  },
  {
    pattern: "/employees",
    description: () => "Viewed employees",
  },
  {
    pattern: "/branches",
    description: () => "Viewed branches",
  },
  {
    pattern: "/suppliers",
    description: () => "Viewed suppliers",
  },
  {
    pattern: "/containers",
    description: () => "Viewed containers",
  },
  {
    pattern: "/payroll",
    description: () => "Viewed payroll",
  },
  {
    pattern: "/bidders",
    description: () => "Viewed bidders",
  },
  {
    pattern: "/users",
    description: () => "Viewed users",
  },
  {
    pattern: "/auctions",
    description: () => "Viewed auctions",
  },
  {
    pattern: "/home",
    description: () => "Viewed home",
  },
];

function normalizePathname(pathname: string) {
  const [pathOnly] = pathname.split("?");
  const normalized = pathOnly.replace(/\/+$/, "");
  return normalized || "/";
}

function decodeSegment(segment: string) {
  try {
    return decodeURIComponent(segment);
  } catch {
    return segment;
  }
}

function matchRoute(pattern: string, pathname: string) {
  const patternSegments = normalizePathname(pattern).split("/").filter(Boolean);
  const pathSegments = normalizePathname(pathname).split("/").filter(Boolean);

  if (patternSegments.length !== pathSegments.length) {
    return null;
  }

  const params: RouteParams = {};

  for (let index = 0; index < patternSegments.length; index += 1) {
    const patternSegment = patternSegments[index];
    const pathSegment = pathSegments[index];
    const paramName = patternSegment.match(/^\[([^\]]+)\]$/)?.[1];

    if (paramName) {
      params[paramName] = decodeSegment(pathSegment);
      continue;
    }

    if (patternSegment !== pathSegment) {
      return null;
    }
  }

  return params;
}

export function getActivityRouteView(
  pathname: string,
): ActivityRouteView | null {
  const normalizedPathname = normalizePathname(pathname);

  for (const route of ROUTES) {
    const params = matchRoute(route.pattern, normalizedPathname);
    if (!params) continue;

    return {
      entity_id: route.pattern,
      description: route.description(params),
      params,
    };
  }

  return null;
}
