"use client";

import { Loader2Icon } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { getBidders } from "@/app/(protected)/bidders/actions";
import { Button } from "@/app/components/ui/button";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import { BidderRowType, BiddersTable } from "./bidders-table";
import { ErrorComponent } from "@/app/components/ErrorComponent";

type Branch = {
  branch_id: string;
  name: string;
};

type BiddersResponse =
  | { ok: true; value: BidderRowType[] }
  | { ok: false; error: { message: string; cause: string } };

export default function Page() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const branches: Branch[] = session?.user.branches ?? [];
  const [bidders, setBidders] = useState<BidderRowType[]>([]);
  const [error, setError] = useState<{ message: string; cause: string } | null>(
    null
  );
  const [selectedBranch, setSelectedBranch] = useState<string>("ALL");
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.replace("/login");
    }
  }, [session, status, router]);

  useEffect(() => {
    if (!session) return;
    if (!branches.length) {
      setLoading(false);
      return;
    }

    const fetchInitialData = async () => {
      try {
        setLoading(true);
        const res: BiddersResponse = await getBidders(
          branches.map((item) => item.branch_id)
        );

        if (!res.ok) {
          setError(res.error);
          return;
        }

        setBidders(res.value);
      } catch (error) {
        setError({
          message: "Unexpected error while fetching bidders",
          cause: String(error),
        });
      }
    };

    fetchInitialData();
    setLoading(false);
  }, [session, branches]);

  const filteredBidders = useMemo(() => {
    if (selectedBranch === "ALL" || !selectedBranch) {
      return bidders;
    }
    return bidders.filter((item) => item.branch_id === selectedBranch);
  }, [bidders, selectedBranch]);

  if (error) {
    return <ErrorComponent error={error} />;
  }

  return (
    <>
      <div className="flex gap-2">
        <Link href="bidders/create">
          <Button>Create Bidder</Button>
        </Link>

        <div className="flex items-center">
          {branches.length > 1 ? (
            <Select
              required
              value={selectedBranch}
              onValueChange={(value) => setSelectedBranch(value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select Branch" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {branches.map((item) => (
                    <SelectItem key={item.branch_id} value={item.branch_id}>
                      {item.name}
                    </SelectItem>
                  ))}
                  <SelectItem value="ALL">ALL BRANCHES</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          ) : (
            <h1 className="text-2xl flex justify-center items-center">
              {status === "loading" ? (
                <Loader2Icon className="animate-spin" />
              ) : (
                `${branches[0].name} BRANCH`
              )}
            </h1>
          )}
        </div>
      </div>

      <div className="my-2">
        {loading ? (
          <div className="flex justify-center items-center h-[100px]">
            <Loader2Icon className="animate-spin" />
          </div>
        ) : (
          <BiddersTable bidders={filteredBidders} branches={branches} />
        )}
      </div>
    </>
  );
}
