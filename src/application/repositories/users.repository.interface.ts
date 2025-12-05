import {
  RegisterUserInputSchema,
  UserSchema,
  UserUpdateInputSchema,
  UserUpdatePasswordInputSchema,
} from "src/entities/models/User";

export interface IUserRepository {
  getUserByUsername: (username: string) => Promise<UserSchema | null>;
  getUsers: () => Promise<UserSchema[]>;
  registerUser: (input: RegisterUserInputSchema) => Promise<UserSchema>;
  updateUser: (
    user_id: string,
    data: UserUpdateInputSchema
  ) => Promise<UserSchema>;
  updateUserPassword: (
    user_id: string,
    data: UserUpdatePasswordInputSchema
  ) => Promise<UserSchema>;
}
