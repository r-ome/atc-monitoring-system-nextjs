import { requireUser } from "@/app/lib/auth";
import { RequestContext } from "@/app/lib/prisma/RequestContext";
import { err, Result } from "src/entities/models/Result";
import { UserRole } from "src/entities/models/User";

type AuthenticatedUser = Awaited<ReturnType<typeof requireUser>>;

type AuthorizeOptions = {
  allowedRoles?: UserRole[];
};

export async function authorizeAction(
  options: AuthorizeOptions = {},
): Promise<Result<AuthenticatedUser>> {
  const user = await requireUser();

  if (
    options.allowedRoles &&
    !options.allowedRoles.includes(user.role as UserRole)
  ) {
    return err({
      message: "Unauthorized",
      cause: "You do not have permission to perform this action.",
    });
  }

  return { ok: true, value: user };
}

export async function runWithUserContext<T>(
  user: AuthenticatedUser,
  callback: () => Promise<T>,
) {
  return await RequestContext.run(
    {
      branch_id: user.branch.branch_id,
      username: user.username ?? "",
      branch_name: user.branch.name ?? "",
    },
    callback,
  );
}

export async function runWithBranchContext<T>(
  user: AuthenticatedUser,
  callback: () => Promise<T>,
) {
  return await RequestContext.run(
    { branch_id: user.branch.branch_id },
    callback,
  );
}
