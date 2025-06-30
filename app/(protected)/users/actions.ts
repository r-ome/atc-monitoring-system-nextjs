"use server";

import { GetUsersController } from "src/controllers/users/get-users.controller";
import { RegisterUserController } from "src/controllers/users/register-user.controller";

export const getUsers = async () => {
  return await GetUsersController();
};

export const registerUser = async (data: FormData) => {
  const input = Object.fromEntries(data.entries());
  return await RegisterUserController(input);
};
