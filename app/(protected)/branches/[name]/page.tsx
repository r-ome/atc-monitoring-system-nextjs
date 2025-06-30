import { Card, CardHeader, CardTitle } from "@/app/components/ui/card";
import { getBranchByName } from "@/app/(protected)/branches/actions";
import { UpdateBranchModal } from "./UpdateBranchModal";
import { ErrorComponent } from "@/app/components/ErrorComponent";

export default async function Page({
  params,
}: Readonly<{ params: { name: string } }>) {
  const { name } = await params;
  const res = await getBranchByName(name);

  if (!res.ok) {
    return <ErrorComponent error={res.error} />;
  }

  const branch = res.value;
  return (
    <div className="h-full p-4">
      <Card>
        <CardHeader>
          <CardTitle>
            <div className="flex justify-between">
              {branch.name} Branch{" "}
              <div>
                <UpdateBranchModal branch={branch} />
              </div>
            </div>
          </CardTitle>
        </CardHeader>
      </Card>
    </div>
  );
}
