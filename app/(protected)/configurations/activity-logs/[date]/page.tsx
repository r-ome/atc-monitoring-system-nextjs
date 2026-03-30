import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/app/components/ui/card";
import { ErrorComponent } from "@/app/components/ErrorComponent";
import { getActivityLogs } from "../actions";
import { ActivityLogsTable } from "./components/ActivityLogsTable";

export default async function Page({
  params,
}: Readonly<{ params: Promise<{ date: string }> }>) {
  const { date } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/");
  if (session.user.role !== "SUPER_ADMIN") redirect("/configurations");

  const res = await getActivityLogs(date);

  if (!res.ok) {
    return <ErrorComponent error={res.error} />;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Activity Logs</CardTitle>
        <CardDescription>{date}</CardDescription>
      </CardHeader>
      <CardContent>
        <ActivityLogsTable logs={res.value} />
      </CardContent>
    </Card>
  );
}
