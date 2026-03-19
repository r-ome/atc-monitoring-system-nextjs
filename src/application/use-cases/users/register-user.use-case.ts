import { UserRepository } from "src/infrastructure/di/repositories";
import { RegisterUserInput } from "src/entities/models/User";
import bcrypt from "bcrypt";
import { InputParseError } from "src/entities/errors/common";

export const registerUserUseCase = async (input: RegisterUserInput) => {
  const existing_username = await UserRepository.getUserByUsername(input.username);
  if (existing_username) {
    throw new InputParseError("Invalid Data!", {
      cause: { username: ["Username already exists!"] },
    });
  }

  input.password = await bcrypt.hash(input.password, 10);
  return await UserRepository.registerUser(input);
};
