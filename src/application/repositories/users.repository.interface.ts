import { RegisterUserInputSchema, UserSchema } from "src/entities/models/User";

export interface IUserRepository {
  getUserByUsername: (username: string) => Promise<UserSchema | null>;
  getUsers: () => Promise<UserSchema[]>;
  registerUser: (input: RegisterUserInputSchema) => Promise<UserSchema>;
}
