import { Container } from "lucide-react";
import { Card } from "@/app/components/ui/card";
import { formatNumberToCurrency } from "@/app/lib/utils";
import { cn } from "@/app/lib/utils";

interface AuctionContainerSummaryTableProps {
  containerSummary: {
    barcode: string;
    total_items: number;
    total_sale: number;
    top_item: {
      description: string | null;
      price: number;
      bidder_number: string | null;
      bidder_name: string | null;
    } | null;
  }[];
}

export const AuctionContainerSummaryTable = ({
  containerSummary,
}: AuctionContainerSummaryTableProps) => {
  return (
    <Card className="flex h-full min-h-0 flex-col gap-0 overflow-hidden p-0 2xl:text-[15px]">
      <div className="flex shrink-0 items-center gap-2 border-b px-[18px] py-3.5 2xl:px-5">
        <Container size={14} className="text-muted-foreground" />
        <span className="text-[14px] font-semibold 2xl:text-[17.5px]">
          Container Summary
        </span>
        <span className="ml-auto text-[11px] text-muted-foreground 2xl:text-[14px]">
          {containerSummary.length} container
          {containerSummary.length === 1 ? "" : "s"}
        </span>
      </div>

      {containerSummary.length === 0 ? (
        <div className="px-[18px] py-8 text-center text-[13px] text-muted-foreground 2xl:text-[15px]">
          No containers in this auction yet.
        </div>
      ) : (
        <div className="flex-1 min-h-0 overflow-auto">
          <table className="w-full border-collapse text-[13px] 2xl:text-[15px]">
            <thead className="sticky top-0 z-10 bg-card">
              <tr className="caps-label text-[10.5px] 2xl:text-[13px]">
                <th className="border-b px-[18px] py-2.5 text-left font-semibold 2xl:px-5">
                  Barcode
                </th>
                <th className="border-b px-3 py-2.5 text-left font-semibold">
                  Top Item
                </th>
                <th className="w-[110px] border-b px-3 py-2.5 text-right font-semibold">
                  Total Items
                </th>
                <th className="w-[150px] border-b px-[18px] py-2.5 text-right font-semibold 2xl:px-5">
                  Total Sale
                </th>
              </tr>
            </thead>
            <tbody>
              {containerSummary.map((row, i) => (
                <tr
                  key={row.barcode}
                  className={cn(
                    "transition-colors hover:bg-secondary/50",
                    i !== containerSummary.length - 1 && "border-b",
                  )}
                >
                  <td className="font-mono px-[18px] py-2.5 font-semibold 2xl:px-5">
                    {row.barcode}
                  </td>
                  <td className="px-3 py-2.5">
                    {row.top_item ? (
                      <div className="flex min-w-0 flex-col gap-0.5">
                        <div className="flex items-baseline gap-2">
                          <span className="line-clamp-1 flex-1 text-[12.5px] font-medium text-foreground/80 2xl:text-[14.5px]">
                            {row.top_item.description ?? "—"}
                          </span>
                          <span className="font-mono text-[12.5px] font-semibold text-primary 2xl:text-[14.5px]">
                            {formatNumberToCurrency(row.top_item.price)}
                          </span>
                        </div>
                        {row.top_item.bidder_number ? (
                          <div className="font-mono line-clamp-1 text-[11px] text-muted-foreground 2xl:text-[13px]">
                            Sold to #{row.top_item.bidder_number}
                            {row.top_item.bidder_name ? ` · ${row.top_item.bidder_name}` : ""}
                          </div>
                        ) : null}
                      </div>
                    ) : (
                      <span className="text-muted-foreground/60">—</span>
                    )}
                  </td>
                  <td className="font-mono px-3 py-2.5 text-right text-foreground/80">
                    {row.total_items.toLocaleString()}
                  </td>
                  <td className="font-mono px-[18px] py-2.5 text-right font-medium 2xl:px-5">
                    {row.total_sale ? (
                      formatNumberToCurrency(row.total_sale)
                    ) : (
                      <span className="text-muted-foreground/60">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
};
