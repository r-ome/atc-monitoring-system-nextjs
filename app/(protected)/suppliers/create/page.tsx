import { ErrorComponent } from "@/app/components/ErrorComponent";
import { authorizeAction } from "@/app/lib/protected-action";
import { SUPPLIER_MANAGEMENT_ROLES } from "@/app/lib/supplier-permissions";
import { CreateSupplierForm } from "./CreateSupplierForm";

export default async function Page() {
  const auth = await authorizeAction({
    allowedRoles: SUPPLIER_MANAGEMENT_ROLES,
  });
  if (!auth.ok) return <ErrorComponent error={auth.error} />;

  return <CreateSupplierForm />;
}
