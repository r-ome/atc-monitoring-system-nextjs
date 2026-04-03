import { formatDate } from "@/app/lib/utils";
import { User, UserWithBranchRow } from "src/entities/models/User";

export function userPresenter(user: UserWithBranchRow): User {
  return {
    user_id: user.user_id,
    name: user.name,
    username: user.username,
    role: user.role,
    last_activity_at: user.last_activity_at?.toISOString() ?? null,
    branch: {
      branch_id: user.branch.branch_id,
      name: user.branch.name,
    },
    created_at: formatDate(user.created_at, "MMMM dd, yyyy"),
    updated_at: formatDate(user.updated_at, "MMMM dd, yyyy"),
  };
}
