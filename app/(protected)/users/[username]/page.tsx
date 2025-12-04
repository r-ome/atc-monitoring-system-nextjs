import { ErrorComponent } from "@/app/components/ErrorComponent";
import { getUserByUsername } from "../actions";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { UpdateUserPasswordModal } from "./UpdateUserPasswordModal";
import { UpdateUserModal } from "./UpdateUserModal";

const Page = async ({
  params,
}: Readonly<{ params: Promise<{ username: string }> }>) => {
  const { username } = await params;
  const res = await getUserByUsername(username);

  if (!res.ok) {
    return <ErrorComponent error={res.error} />;
  }

  const user = res.value;

  return (
    <div>
      <Card className="w-full">
        <CardHeader className="flex justify-between">
          <div>
            <CardTitle>
              <div className="flex gap-2 items-center">
                <div>{user.name}</div>
                <Badge>{user.role}</Badge>
              </div>
            </CardTitle>
            <CardDescription>
              <div>{user.username}</div>
              <div>{user.branch.name}</div>
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <UpdateUserModal user={user} />
            <UpdateUserPasswordModal user={user} />
          </div>
        </CardHeader>
      </Card>
    </div>
  );
};

export default Page;
