export const dynamic = "force-dynamic";

import {
  SidebarProvider,
  SidebarTrigger,
  SidebarInset,
} from "@/app/components/ui/sidebar";

import { AppSideBar } from "@/app/components/sidebar/sidebar";
import { Separator } from "@/app/components/ui/separator";
import { AppBreadcrumb } from "@/app/components/breadcrumbs/breadcrumbs";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import { redirect } from "next/navigation";
import { AppTimer } from "@/app/components/timer/timer";

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  return (
    <SidebarProvider>
      <AppSideBar />

      <SidebarInset>
        <header className="flex justify-between h-16 items-center gap-2 border-b px-4 w-full">
          <div className="flex items-center">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <AppBreadcrumb branch={session.user.branch?.name} />
          </div>

          <div className="flex gap-4 h-10 items-center">
            <div>
              {session.user.name} | {session.user.role}
            </div>
            <Separator
              orientation="vertical"
              className="mx-2 h-5 bg-gray-400"
            />
            <AppTimer />
          </div>
        </header>

        <main className="w-full w-max-[1000px] p-2">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
