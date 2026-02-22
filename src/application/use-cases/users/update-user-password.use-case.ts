import bcrypt from "bcrypt";
import { UpdateUserPasswordInput } from "src/entities/models/User";
import { UserRepository } from "src/infrastructure/repositories/users.repository";

export const updateUserPasswordUseCase = async (
  user_id: string,
  data: UpdateUserPasswordInput,
) => {
  const hashedPassword = await bcrypt.hash(data.password, 10);
  return await UserRepository.updateUserPassword(user_id, { ...data, password: hashedPassword });
};
