import { Separator } from "@/app/components/ui/separator";
import { StatusBadge } from "@/app/components/admin";
import { Container } from "src/entities/models/Container";
import { UpdateContainerModal } from "./UpdateContainerModal";
import { UpdateContainerStatusButton } from "./UpdateContainerStatusButton";
import { DeleteContainerModal } from "./DeleteContainerModal";

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
  const ContainerProfile = ({
    container,
  }: {
    container: Omit<Container, "inventories">;
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

    return profile.map((item, i) => {
      const value = container[item];

      let data: React.ReactNode;

      if (
        item === "supplier" &&
        typeof value === "object" &&
        value !== null &&
        "name" in value &&
        "supplier_code" in value
      ) {
        data = `${value.name} (${value.supplier_code})`;
      } else if (value instanceof Date) {
        data = value.toLocaleDateString();
      } else if (item === "duties_and_taxes") {
        data = Number(value).toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        });
      } else if (item === "gross_weight") {
        data = `${(
          Number(value?.toString()?.replace(/ kgs/gi, "")) * 0.001
        ).toFixed(2)} tons`;
      } else {
        data = value as React.ReactNode;
      }

      return (
        <div className="flex space-x-4" key={i}>
          <p className="leading-5 text-md w-[200px]">
            {item.replace(/_/g, " ").toUpperCase()}:
          </p>
          <Separator orientation="vertical" />
          <p className="leading-7 text-md">{data}</p>
        </div>
      );
    });
  };

  return (
    <div className="w-full overflow-hidden rounded-lg border">
      <div className="flex items-center justify-between gap-4 p-6">
        <div className="flex items-center gap-2">
          <span className="font-semibold">Container: {container.barcode}</span>
          <StatusBadge variant={container.status === "PAID" ? "paid" : "unpaid"}>
            {container.status}
          </StatusBadge>
        </div>
        <div className="flex gap-2">
          <UpdateContainerStatusButton
            container_id={container.container_id}
            status={container.status}
            paid_at={container.paid_at}
          />
          <UpdateContainerModal container={container} />
          <DeleteContainerModal container={container} />
        </div>
      </div>
      <Separator />
      <div className="flex flex-col gap-6 px-6 py-4">
        <div className="flex flex-col flex-wrap gap-4">
          <ContainerProfile container={container} />
        </div>
      </div>
    </div>
  );
};
