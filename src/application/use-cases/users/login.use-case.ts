import { getUserByUsernameUseCase } from "./get-user-by-username.use-case";
import bcrypt from "bcrypt";
import { InputParseError, NotFoundError } from "src/entities/errors/common";

export const loginUseCase = async (username: string, password: string) => {
  const user = await getUserByUsernameUseCase(username);

  if (!user) {
    throw new NotFoundError("User not found!");
  }

  const is_match = await bcrypt.compare(password, user.password);
  if (is_match) {
    return user;
  } else {
    throw new InputParseError("Invalid Data!", {
      cause: { password: ["The password you've entered is incorrect!"] },
    });
  }
};
