import { getUsers } from "./actions";
import { ErrorComponent } from "@/app/components/ErrorComponent";
import { UsersList } from "./UsersList";

export default async function Page() {
  const users_res = await getUsers();

  if (!users_res.ok) {
    return <ErrorComponent error={users_res.error} />;
  }

  const users = users_res.value;
  return (
    <UsersList users={users} />
  );
}
