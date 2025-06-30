import { UserRepository } from "src/infrastructure/repositories/users.repository";
import { RegisterUserInputSchema } from "src/entities/models/User";
import { getUserByUsernameUseCase } from "./get-user-by-username.use-case";
import bcrypt from "bcrypt";
import { InputParseError } from "src/entities/errors/common";

export const registerUserUseCase = async (input: RegisterUserInputSchema) => {
  const existing_username = await getUserByUsernameUseCase(input.username);
  if (existing_username) {
    throw new InputParseError("Invalid Data!", {
      cause: { username: ["Username already exists!"] },
    });
  }

  input.password = await bcrypt.hash(input.password, 10);
  return await UserRepository.registerUser(input);
};
