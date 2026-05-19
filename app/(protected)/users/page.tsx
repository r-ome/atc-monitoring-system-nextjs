import Link from "next/link";
import { getUsers } from "./actions";
import { Button } from "@/app/components/ui/button";
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

      <UsersList users={users} />
    </PageContainer>
  );
}
