import { redirect } from "next/navigation";
import { requireSession } from "@/app/lib/auth";
import { ErrorComponent } from "@/app/components/ErrorComponent";
import { PageContainer } from "@/app/components/PageContainer";
import { getActivityLogs } from "../actions";
import { ActivityLogsTable } from "./components/ActivityLogsTable";
import { ActivityLogsBreadcrumb } from "./ActivityLogsBreadcrumb";

export default async function Page({
  params,
}: Readonly<{ params: Promise<{ date: string }> }>) {
  const { date } = await params;
  const session = await requireSession();
  if (!["SUPER_ADMIN", "OWNER"].includes(session.user.role))
    redirect("/configurations");

  const res = await getActivityLogs(date);

  if (!res.ok) {
    return <ErrorComponent error={res.error} />;
  }

  return (
    <PageContainer>
      <ActivityLogsBreadcrumb date={date} />
      <ActivityLogsTable logs={res.value} date={date} />
    </PageContainer>
  );
}
