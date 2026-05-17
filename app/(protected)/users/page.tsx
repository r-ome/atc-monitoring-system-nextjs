import Link from "next/link";
import { UsersRound } from "lucide-react";
import { getUsers } from "./actions";
import { Button } from "@/app/components/ui/button";
import { Card } from "@/app/components/ui/card";
import { ErrorComponent } from "@/app/components/ErrorComponent";
import { PageContainer } from "@/app/components/PageContainer";
import { PageHeader } from "@/app/components/PageHeader";
import { UsersList } from "./UsersList";

export default async function Page() {
  const users_res = await getUsers();

  if (!users_res.ok) {
    return <ErrorComponent error={users_res.error} />;
  }

  const users = users_res.value;
  return (
    <PageContainer>
      <PageHeader
        title="Users"
        subtitle="Manage system user accounts"
        actions={
          <Link href="users/create">
            <Button>Register User</Button>
          </Link>
        }
      />

      <Card className="flex flex-col p-3.5 2xl:p-5 2xl:text-[15px]">
        <div className="mb-3 flex items-center gap-2">
          <UsersRound size={14} className="text-muted-foreground" />
          <span className="text-[13.5px] font-semibold 2xl:text-[17.5px]">
            All Users
          </span>
          <span className="ml-auto text-[11px] text-muted-foreground 2xl:text-[15px]">
            {users.length.toLocaleString()} total
          </span>
        </div>

        <UsersList users={users} />
      </Card>
    </PageContainer>
  );
}
