export const dynamic = "force-dynamic";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
} from "@/app/components/ui/sidebar";
import { requireSession } from "@/app/lib/auth";
import { AppSidebarMenu } from "./SidebarMenu";

export async function AppSideBar() {
  const session = await requireSession();

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
