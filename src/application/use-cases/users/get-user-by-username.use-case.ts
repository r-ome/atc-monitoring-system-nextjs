import { UserRepository } from "src/infrastructure/repositories/users.repository";

export const getUserByUsernameUseCase = async (username: string) => {
  return UserRepository.getUserByUsername(username);
};
