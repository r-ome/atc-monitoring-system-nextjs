import { UserRepository } from "src/infrastructure/di/repositories";
import bcrypt from "bcrypt";
import { InputParseError, NotFoundError } from "src/entities/errors/common";
import { logActivityWithContext } from "@/app/lib/log-activity";

export const loginUseCase = async (username: string, password: string) => {
  const user = await UserRepository.getAuthUserByUsername(username);

  if (!user) {
    throw new NotFoundError("User not found!");
  }

  const is_match = await bcrypt.compare(password, user.password);
  if (is_match) {
    const updatedUser = await UserRepository.updateLastActivity(
      user.user_id,
      new Date(),
    );

    await logActivityWithContext({
      username: user.username,
      branch_id: user.branch.branch_id,
      branch_name: user.branch.name,
      action: "CREATE",
      entity_type: "session",
      entity_id: user.user_id,
      description: `Logged in as ${user.username}`,
    });

    return {
      ...user,
      last_activity_at: updatedUser.last_activity_at,
    };
  } else {
    throw new InputParseError("Invalid Data!", {
      cause: { password: ["The password you've entered is incorrect!"] },
    });
  }
};
