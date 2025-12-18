export const dynamic = "force-dynamic";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
} from "@/app/components/ui/sidebar";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import { redirect } from "next/navigation";
import { AppSidebarMenu } from "./SidebarMenu";

export async function AppSideBar() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex justify-center">ATC Monitoring System</div>
      </SidebarHeader>
      <SidebarContent>
        <AppSidebarMenu session={session} />
      </SidebarContent>
    </Sidebar>
  );
}
