import { getBidders } from "@/app/(protected)/bidders/actions";
import Link from "next/link";
import { Button } from "@/app/components/ui/button";
import { BiddersTable } from "./bidders-table";
import { ErrorComponent } from "@/app/components/ErrorComponent";

export default async () => {
  const res = await getBidders();

  if (!res.ok) {
    return <ErrorComponent error={res.error} />;
  }

  const bidders = res.value;
  return (
    <>
      <Link href="bidders/create">
        <Button>Create Bidder</Button>
      </Link>

      <div className="my-2">
        <BiddersTable bidders={bidders} />
      </div>
    </>
  );
};
