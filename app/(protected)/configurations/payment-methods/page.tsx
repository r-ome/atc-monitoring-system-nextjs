import Link from "next/link";
import { Button } from "@/app/components/ui/button";
import { PaymentMethodsTable } from "./components/payment-methods-table";
import { getPaymentMethods } from "./actions";
import { ErrorComponent } from "@/app/components/ErrorComponent";

const Page = async () => {
  const res = await getPaymentMethods();

  if (!res.ok) {
    return <ErrorComponent error={res.error} />;
  }

  return (
    <>
      <Link href="payment-methods/create">
        <Button>Create Payment Method</Button>
      </Link>

      <div className="my-2">
        <PaymentMethodsTable payment_methods={res.value} />
      </div>
    </>
  );
};

export default Page;
