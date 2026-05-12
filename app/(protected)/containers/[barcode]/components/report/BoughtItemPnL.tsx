"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import { Separator } from "@/app/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/app/components/ui/tooltip";
import { InfoIcon } from "lucide-react";

interface BoughtItemPnLProps {
  containerStatus: "PAID" | "UNPAID";
  inventories: {
    is_bought_item: number;
    auctions_inventory: {
      status: string;
      price: number;
    } | null;
  }[];
}

function formatPeso(value: number): string {
  return value.toLocaleString("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function Row({
  label,
  hint,
  value,
  className,
}: {
  label: string;
  hint: string;
  value: string;
  className?: string;
}) {
  return (
    <div className="flex justify-between items-center py-1">
      <div className="flex items-center gap-1.5">
        <span className="text-sm font-medium text-muted-foreground">
          {label}
        </span>
        <Tooltip>
          <TooltipTrigger asChild>
            <InfoIcon className="size-3.5 text-muted-foreground/60 cursor-help shrink-0" />
          </TooltipTrigger>
          <TooltipContent
            side="right"
            className="max-w-72 whitespace-pre-line"
          >
            {hint}
          </TooltipContent>
        </Tooltip>
      </div>
      <span
        className={`text-sm font-semibold tabular-nums ${className ?? ""}`}
      >
        {value}
      </span>
    </div>
  );
}

export const BoughtItemPnL: React.FC<BoughtItemPnLProps> = ({
  containerStatus,
  inventories,
}) => {
  const declaredItems = inventories.filter((inv) => inv.is_bought_item > 0);
  const declaredTotal = declaredItems.reduce(
    (sum, inv) => sum + inv.is_bought_item,
    0,
  );
  const recoveredItems = declaredItems.filter(
    (inv) => inv.auctions_inventory?.status === "PAID",
  );
  const recoveredTotal = recoveredItems.reduce(
    (sum, inv) => sum + (inv.auctions_inventory?.price ?? 0),
    0,
  );
  const pnl = recoveredTotal - declaredTotal;
  const outstanding = declaredItems.length - recoveredItems.length;

  if (containerStatus === "UNPAID") {
    return (
      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle>Bought-Item P&amp;L</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Bought-item profit/loss is tracked once this container is marked
            PAID. Items declared as BOUGHT_ITEM before then are still part of
            the supplier&apos;s settlement.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-lg">
      <CardHeader>
        <CardTitle>Bought-Item P&amp;L</CardTitle>
      </CardHeader>
      <CardContent className="space-y-1">
        <Row
          label="Declared Total"
          hint="Sum of declared prices (inventories.is_bought_item) for every item in this container that was reported to the supplier as BOUGHT_ITEM."
          value={formatPeso(declaredTotal)}
          className="text-red-600"
        />
        <Row
          label="Recovered Total"
          hint="Sum of PAID auction prices for those declared items that have resold in later auctions."
          value={formatPeso(recoveredTotal)}
          className="text-green-600"
        />

        <Separator className="my-2" />

        <Row
          label="Owner P&L"
          hint="Recovered − Declared. Positive = profit. Negative = loss the owner still expects to recover from items not yet resold."
          value={formatPeso(pnl)}
          className={pnl >= 0 ? "text-green-600" : "text-red-600"}
        />

        <Separator className="my-2" />

        <Row
          label="Declared Items"
          hint="Total count of items declared as BOUGHT_ITEM for this container."
          value={declaredItems.length.toLocaleString("en-PH")}
        />
        <Row
          label="Recovered Items"
          hint="Count of declared items that have a PAID resale row."
          value={recoveredItems.length.toLocaleString("en-PH")}
        />
        <Row
          label="Outstanding"
          hint="Declared items not yet resold. Some will resell; some are silently leaked into 00/T0 via scratched-barcode rebarcoding. Watch this number — a stuck-high outstanding count is the leak diagnostic."
          value={outstanding.toLocaleString("en-PH")}
          className={outstanding === 0 ? "text-green-600" : "text-orange-500"}
        />
      </CardContent>
    </Card>
  );
};
