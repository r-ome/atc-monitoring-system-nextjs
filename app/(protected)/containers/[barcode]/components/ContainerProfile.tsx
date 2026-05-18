import { Container } from "src/entities/models/Container";

type Field =
  | "bill_of_lading_number"
  | "container_number"
  | "auction_or_sell"
  | "arrival_date"
  | "due_date"
  | "auction_start_date"
  | "paid_at"
  | "supplier"
  | "duties_and_taxes"
  | "gross_weight";

interface ContainerProfileProps {
  container: Omit<Container, "inventories"> & {
    inventories: Omit<
      Container["inventories"][number],
      "histories" | "auctions_inventory"
    >[];
  };
}

export const ContainerProfile: React.FC<ContainerProfileProps> = async ({
  container,
}) => {
  const profile: Field[] = [
    "bill_of_lading_number",
    "container_number",
    "auction_or_sell",
    "arrival_date",
    "due_date",
    "auction_start_date",
    "paid_at",
    "supplier",
    "duties_and_taxes",
    "gross_weight",
  ];

  const renderValue = (item: Field): React.ReactNode => {
    const value = container[item];

    if (
      item === "supplier" &&
      typeof value === "object" &&
      value !== null &&
      "name" in value &&
      "supplier_code" in value
    ) {
      return `${value.name} (${value.supplier_code})`;
    }
    if (value instanceof Date) {
      return value.toLocaleDateString();
    }
    if (item === "duties_and_taxes") {
      return Number(value).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    }
    if (item === "gross_weight") {
      return `${(
        Number(value?.toString()?.replace(/ kgs/gi, "")) * 0.001
      ).toFixed(2)} tons`;
    }
    return (value as React.ReactNode) || "—";
  };

  return (
    <div className="rounded-lg border bg-card">
      <dl className="divide-y">
        {profile.map((item) => (
          <div
            key={item}
            className="flex flex-col gap-1 px-4 py-3 sm:grid sm:grid-cols-[200px_1fr] sm:items-center sm:gap-4 sm:px-6 sm:py-3.5"
          >
            <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground sm:text-[12px]">
              {item.replace(/_/g, " ")}
            </dt>
            <dd className="text-[14px] text-foreground sm:text-[15px]">
              {renderValue(item)}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
};
