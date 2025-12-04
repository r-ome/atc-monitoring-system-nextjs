import bcrypt from "bcrypt";
import { UserUpdatePasswordInputSchema } from "src/entities/models/User";
import { UserRepository } from "src/infrastructure/repositories/users.repository";

export const updateUserPasswordUseCase = async (
  user_id: string,
  data: UserUpdatePasswordInputSchema
) => {
  data.password = await bcrypt.hash(data.password, 10);
  return await UserRepository.updateUserPassword(user_id, data);
};
