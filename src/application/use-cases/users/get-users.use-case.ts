import { UserRepository } from "src/infrastructure/repositories/users.repository";

export const getUsersUseCase = async () => {
  return await UserRepository.getUsers();
};
