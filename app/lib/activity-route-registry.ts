type RouteParams = Record<string, string>;

type ActivityRoute = {
  pattern: string;
  description: (params: RouteParams) => string;
};

export type ActivityRouteView = {
  entity_id: string;
  description: string;
};

const ROUTES: ActivityRoute[] = [
  {
    pattern: "/auctions/[auction_date]/registered-bidders/[bidder_number]",
    description: ({ auction_date, bidder_number }) =>
      `Viewed registered bidder #${bidder_number} for auction ${auction_date}`,
  },
  {
    pattern: "/auctions/[auction_date]/registered-bidders",
    description: ({ auction_date }) =>
      `Viewed registered bidders for auction ${auction_date}`,
  },
  {
    pattern: "/auctions/[auction_date]/monitoring/[auction_inventory_id]",
    description: ({ auction_date }) =>
      `Viewed auction item details for auction ${auction_date}`,
  },
  {
    pattern: "/auctions/[auction_date]/monitoring",
    description: ({ auction_date }) =>
      `Viewed auction monitoring for ${auction_date}`,
  },
  {
    pattern: "/auctions/[auction_date]/counter-check",
    description: ({ auction_date }) =>
      `Viewed counter check for auction ${auction_date}`,
  },
  {
    pattern: "/auctions/[auction_date]/payments/[receipt_number]/receipt",
    description: ({ auction_date, receipt_number }) =>
      `Viewed printable receipt ${receipt_number} for auction ${auction_date}`,
  },
  {
    pattern: "/auctions/[auction_date]/payments/[receipt_number]",
    description: ({ auction_date, receipt_number }) =>
      `Viewed receipt ${receipt_number} for auction ${auction_date}`,
  },
  {
    pattern: "/auctions/[auction_date]/payments",
    description: ({ auction_date }) =>
      `Viewed auction payments for ${auction_date}`,
  },
  {
    pattern: "/auctions/[auction_date]/manifest",
    description: ({ auction_date }) =>
      `Viewed manifest for auction ${auction_date}`,
  },
  {
    pattern: "/auctions/[auction_date]",
    description: ({ auction_date }) =>
      `Viewed auction overview for ${auction_date}`,
  },
  {
    pattern: "/containers/[barcode]/inventories/[inventory_id]",
    description: ({ barcode }) =>
      `Viewed inventory item in container ${barcode}`,
  },
  {
    pattern: "/containers/[barcode]",
    description: ({ barcode }) => `Viewed container ${barcode}`,
  },
  {
    pattern: "/bidders/[bidder_number]",
    description: ({ bidder_number }) => `Viewed bidder #${bidder_number}`,
  },
  {
    pattern: "/payroll/[payroll_period_id]",
    description: () => "Viewed payroll period details",
  },
  {
    pattern: "/suppliers/[supplier_code]",
    description: ({ supplier_code }) => `Viewed supplier ${supplier_code}`,
  },
  {
    pattern: "/transactions/[transaction_date]",
    description: ({ transaction_date }) =>
      `Viewed transactions for ${transaction_date}`,
  },
  {
    pattern: "/configurations/activity-logs/[date]",
    description: ({ date }) => `Viewed activity logs for ${date}`,
  },
  {
    pattern: "/users/create",
    description: () => "Viewed create user",
  },
  {
    pattern: "/suppliers/create",
    description: () => "Viewed create supplier",
  },
  {
    pattern: "/bidders/create",
    description: () => "Viewed create bidder",
  },
  {
    pattern: "/configurations/payment-methods/create",
    description: () => "Viewed create payment method",
  },
  {
    pattern: "/configurations/payment-methods",
    description: () => "Viewed payment methods",
  },
  {
    pattern: "/configurations/activity-logs",
    description: () => "Viewed activity logs calendar",
  },
  {
    pattern: "/configurations",
    description: () => "Viewed configurations",
  },
  {
    pattern: "/monitoring-all",
    description: () => "Viewed all monitoring",
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
    };
  }

  return null;
}
