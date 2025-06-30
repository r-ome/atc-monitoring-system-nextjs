import { getBoughtItems } from "@/app/(protected)/inventories/actions";
import { UploadBoughtItems } from "./UploadBoughtItems";
import { ErrorComponent } from "@/app/components/ErrorComponent";
import { BoughtItemsTable } from "./BoughtItemsTable";

export default async function Page() {
  const res = await getBoughtItems();

  if (!res.ok) {
    return <ErrorComponent error={res.error} />;
  }

  const bought_items = res.value;

  return (
    <div className="flex flex-col gap-2">
      <h1 className="text-2xl text-center">Bought Items Master List</h1>
      <div>
        <UploadBoughtItems />
      </div>

      <BoughtItemsTable boughtItems={bought_items} />
    </div>
  );
}
