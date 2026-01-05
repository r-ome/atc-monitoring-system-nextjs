import { getBidders } from "@/app/(protected)/bidders/actions";
import Link from "next/link";
import { Button } from "@/app/components/ui/button";
import { ErrorComponent } from "@/app/components/ErrorComponent";
import { BiddersTable } from "@/app/(protected)/bidders/components/bidders-table";
import { UploadBiddersModal } from "./components/UploadBiddersModal";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";

export default async function Page() {
  const res = await getBidders();
  const session = await getServerSession(authOptions);

  if (!res.ok) {
    return <ErrorComponent error={res.error} />;
  }

  const bidders = res.value;
  const user = session?.user;

  return (
    <>
      <div className="flex gap-2">
        <Link href="bidders/create">
          <Button>Create Bidder</Button>
        </Link>

        {["OWNER", "SUPER_ADMIN"].includes(user?.role ?? "") ? (
          <UploadBiddersModal />
        ) : null}
      </div>

      <div className="my-2">
        <BiddersTable bidders={bidders} />
      </div>
    </>
  );
}
