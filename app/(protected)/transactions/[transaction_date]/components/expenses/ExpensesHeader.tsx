"use client";

import { useMemo } from "react";
import { useParams } from "next/navigation";
import {
  Wallet,
  PiggyBank,
  Receipt,
  Banknote,
  ArrowUpCircle,
} from "lucide-react";
import { StatCard, StatCardGroup } from "@/app/components/admin/stat-card";
import { Expense, PettyCash } from "src/entities/models/Expense";
import { formatDate } from "@/app/lib/utils";

interface ExpensesHeaderProps {
  expenses: Expense[];
  lastPettyCash: PettyCash | null;
  currentPettyCash: PettyCash | null;
}

export const ExpensesHeader: React.FC<ExpensesHeaderProps> = ({
  expenses,
  currentPettyCash,
  lastPettyCash,
}) => {
  const { transaction_date }: { transaction_date: string } = useParams();

  const totals = useMemo(() => {
    const totalExpenses = expenses
      .filter((item) => item.purpose === "EXPENSE")
      .reduce((acc, item) => acc + item.amount, 0);

    const totalCurrentPettyCash = expenses
      .filter((item) => item.purpose === "ADD_PETTY_CASH")
      .reduce((acc, item) => acc + item.amount, 0);

    const yesterdayBalance = lastPettyCash ? lastPettyCash.amount : 0;
    const pettyCashBalance = yesterdayBalance + totalCurrentPettyCash;

    return {
      PETTY_CASH_BALANCE: pettyCashBalance,
      YESTERDAY_PETTY_CASH: yesterdayBalance,
      CASH_ON_HAND_FOR_PETTY_CASH: pettyCashBalance - totalExpenses,
      TOTAL_EXPENSES: totalExpenses,
      TODAY_PETTY_CASH: totalCurrentPettyCash,
    };
  }, [expenses, lastPettyCash, currentPettyCash]);

  const yesterdaySuffix =
    lastPettyCash != null
      ? ` (${formatDate(new Date(lastPettyCash.created_at), "MMM-dd")})`
      : "";
  const todayLabel = `TODAY'S PETTY CASH (${formatDate(new Date(transaction_date), "MMM dd")})`;

  const fmt = (n: number) => `₱${n.toLocaleString()}`;

  const COMPACT_CARD =
    "gap-0 py-0 [&_[data-slot=card-content]]:p-4 [&_p.text-2xl]:text-base";

  return (
    <StatCardGroup columns={5}>
      <StatCard
        title="PETTY CASH BALANCE"
        value={fmt(totals.PETTY_CASH_BALANCE)}
        icon={Wallet}
        variant="primary"
        className={COMPACT_CARD}
      />
      <StatCard
        title={`YESTERDAY PETTY CASH${yesterdaySuffix}`}
        value={fmt(totals.YESTERDAY_PETTY_CASH)}
        icon={PiggyBank}
        className={COMPACT_CARD}
      />
      <StatCard
        title="CASH ON HAND FOR PETTY CASH"
        value={fmt(totals.CASH_ON_HAND_FOR_PETTY_CASH)}
        icon={Banknote}
        variant={totals.CASH_ON_HAND_FOR_PETTY_CASH < 0 ? "error" : "success"}
        className={COMPACT_CARD}
      />
      <StatCard
        title="TOTAL EXPENSES"
        value={fmt(totals.TOTAL_EXPENSES)}
        icon={Receipt}
        variant={totals.TOTAL_EXPENSES > 0 ? "error" : "default"}
        className={COMPACT_CARD}
      />
      <StatCard
        title={todayLabel}
        value={fmt(totals.TODAY_PETTY_CASH)}
        icon={ArrowUpCircle}
        className={COMPACT_CARD}
      />
    </StatCardGroup>
  );
};
