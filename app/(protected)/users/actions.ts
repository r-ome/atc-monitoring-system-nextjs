"use server";

import { GetUserByUsernameController } from "src/controllers/users/get-user-by-username.controller";
import { GetUsersController } from "src/controllers/users/get-users.controller";
import { RegisterUserController } from "src/controllers/users/register-user.controller";
import { UpdateUserController } from "src/controllers/users/update-user.controller";
import { UpdateUserPasswordController } from "src/controllers/users/update-user-password.controller";

export const getUserByUsername = async (username: string) => {
  return await GetUserByUsernameController(username);
};

export const getUsers = async () => {
  return await GetUsersController();
};

export const registerUser = async (formData: FormData) => {
  const input = Object.fromEntries(formData.entries());
  return await RegisterUserController(input);
};

export const updateUser = async (user_id: string, formData: FormData) => {
  const input = Object.fromEntries(formData.entries());
  return await UpdateUserController(user_id, input);
};

export const updateUserPassword = async (
  user_id: string,
  formData: FormData
) => {
  const input = Object.fromEntries(formData.entries());
  return await UpdateUserPasswordController(user_id, input);
};
