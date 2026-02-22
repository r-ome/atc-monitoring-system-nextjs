import { UpdateUserInput } from "src/entities/models/User";
import { UserRepository } from "src/infrastructure/repositories/users.repository";

export const updateUserUseCase = async (
  user_id: string,
  data: UpdateUserInput
) => {
  return await UserRepository.updateUser(user_id, data);
};
