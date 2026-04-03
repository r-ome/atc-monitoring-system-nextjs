import {
  AuthUserWithBranchRow,
  RegisterUserInput,
  UserWithBranchRow,
  UpdateUserInput,
  UpdateUserPasswordInput,
} from "src/entities/models/User";

export interface IUserRepository {
  getUserByUsername: (username: string) => Promise<UserWithBranchRow | null>;
  getAuthUserByUsername: (
    username: string,
  ) => Promise<AuthUserWithBranchRow | null>;
  getUsers: () => Promise<UserWithBranchRow[]>;
  registerUser: (input: RegisterUserInput) => Promise<UserWithBranchRow>;
  updateUser: (
    user_id: string,
    data: UpdateUserInput,
  ) => Promise<UserWithBranchRow>;
  updateUserPassword: (
    user_id: string,
    data: UpdateUserPasswordInput,
  ) => Promise<UserWithBranchRow>;
  updateLastActivity: (
    user_id: string,
    last_activity_at: Date,
  ) => Promise<UserWithBranchRow>;
}
