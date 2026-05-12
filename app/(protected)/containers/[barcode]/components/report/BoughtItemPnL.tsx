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
          <CardTitle>Bought-Item Profit And Loss</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Bought-item profit and loss starts being tracked once this
            container is marked as paid. Until then, any items taken over from
            the supplier are still part of the supplier&apos;s settlement.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-lg">
      <CardHeader>
        <CardTitle>Bought-Item Profit And Loss</CardTitle>
      </CardHeader>
      <CardContent className="space-y-1">
        <Row
          label="Declared Items"
          hint="Number of items in this container that were taken over from the supplier after the due date."
          value={declaredItems.length.toLocaleString("en-PH")}
        />
        <Row
          label="Recovered Items"
          hint="Number of those items that have been resold and paid for in a later auction."
          value={recoveredItems.length.toLocaleString("en-PH")}
        />
        <Row
          label="Outstanding"
          hint="Items still waiting to be resold. Some will eventually sell at future auctions, while some may end up under the owner containers (00 / T0) if their original sticker gets damaged and they need to be rebarcoded. If this number stays high for a long time, it usually means more items are being lost to rebarcoding than expected."
          value={outstanding.toLocaleString("en-PH")}
          className={outstanding === 0 ? "text-green-600" : "text-orange-500"}
        />

        <Separator className="my-2" />

        <Row
          label="Declared Total"
          hint="Total amount paid to the supplier for items in this container that did not sell before the due date. These items are now owned by the business."
          value={formatPeso(declaredTotal)}
          className="text-red-600"
        />
        <Row
          label="Recovered Total"
          hint="Total amount earned so far from reselling those items in later auctions."
          value={formatPeso(recoveredTotal)}
          className="text-green-600"
        />

        <Separator className="my-2" />

        <Row
          label={
            pnl > 0
              ? "Bought Items Profit"
              : pnl < 0
                ? "Bought Items Loss"
                : "Bought Items Profit/Loss"
          }
          hint="Recovered amount minus Declared amount. A positive number means the business made a profit. A negative number means there is still a loss that may be recovered as more items are sold."
          value={formatPeso(pnl)}
          className={pnl >= 0 ? "text-green-600" : "text-red-600"}
        />
      </CardContent>
    </Card>
  );
};
