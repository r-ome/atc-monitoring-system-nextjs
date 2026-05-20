"use server";

import { redirect } from "next/navigation";
import { ErrorComponent } from "@/app/components/ErrorComponent";
import { requireUser } from "@/app/lib/auth";
import { getBranches } from "../branches/actions";
import { TransactionsCalendarClient } from "./TransactionsCalendarClient";

export default async function Page({
  searchParams,
}: Readonly<{
  searchParams: Promise<Record<string, string | undefined>>;
}>) {
  const { branch_id } = await searchParams;
  const user = await requireUser();
  const branchesRes = await getBranches();

  if (!branchesRes.ok) {
    return <ErrorComponent error={branchesRes.error} />;
  }

  const branches = branchesRes.value;
  const canSelectBranch = ["SUPER_ADMIN", "OWNER"].includes(user.role);
  const fallbackBranch = canSelectBranch
    ? (branches.find((branch) => branch.name === "BIÑAN") ?? null)
    : (branches.find((branch) => branch.branch_id === user.branch.branch_id) ??
      null);

  const branchId = canSelectBranch
    ? String(branch_id ?? fallbackBranch?.branch_id)
    : String(fallbackBranch?.branch_id);

  if (!branchId) redirect("/");

  const selectedBranch =
    branches.find((branch) => branch.branch_id === branchId) ?? fallbackBranch;

  if (!selectedBranch) redirect("/");

  return (
    <TransactionsCalendarClient
      user={{ role: user.role }}
      branches={branches}
      selectedBranch={selectedBranch}
    />
  );
}
