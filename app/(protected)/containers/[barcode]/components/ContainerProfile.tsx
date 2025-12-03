import {
  ResizablePanel,
  ResizablePanelGroup,
} from "@/app/components/ui/resizable";
import { Separator } from "@/app/components/ui/separator";
import { Container } from "src/entities/models/Container";
import { UpdateContainerModal } from "./UpdateContainerModal";
import { DeleteContainerModal } from "./DeleteContainerModal";

type Field =
  | "bill_of_lading_number"
  | "container_number"
  | "auction_or_sell"
  | "arrival_date"
  | "due_date"
  | "auction_end_date"
  | "supplier";

interface ContainerProfileProps {
  container: Omit<Container, "inventories"> & {
    inventories: Omit<
      Container["inventories"][number],
      "histories" | "auctions_inventories"
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
      "auction_end_date",
      "supplier",
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
    <ResizablePanelGroup
      direction="vertical"
      className="min-h-[350px] max-h-[500px] w-full rounded-lg border"
    >
      <ResizablePanel defaultSize={15}>
        <div className="flex h-full items-center justify-between gap-4 p-6">
          <span className="font-semibold">Container: {container.barcode}</span>
          <div className="flex gap-2">
            <UpdateContainerModal container={container} />
            <DeleteContainerModal container={container} />
          </div>
        </div>
      </ResizablePanel>

      <Separator />

      <ResizablePanel defaultSize={85}>
        <div className="flex flex-col flex-wrap h-full px-6 py-4 space-y-4">
          <ContainerProfile container={container} />
        </div>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
};
