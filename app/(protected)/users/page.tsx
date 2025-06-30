import Link from "next/link";
import { Button } from "@/app/components/ui/button";
import { getUsers } from "./actions";
import { UsersTable } from "./users-table";
import { ErrorComponent } from "@/app/components/ErrorComponent";

export default async function Page() {
  const users_res = await getUsers();

  if (!users_res.ok) {
    return <ErrorComponent error={users_res.error} />;
  }

  const users = users_res.value;
  return (
    <div className="space-y-2">
      <div>
        <Link href="users/create">
          <Button>Register User</Button>
        </Link>
      </div>

      <div>
        <UsersTable users={users} />
      </div>
    </div>
  );
}
