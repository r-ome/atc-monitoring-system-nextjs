"use server";

import { GetUsersController } from "src/controllers/users/get-users.controller";
import { RegisterUserController } from "src/controllers/users/register-user.controller";

export const getUsers = async () => {
  return await GetUsersController();
};

export const registerUser = async (formData: FormData) => {
  const input = Object.fromEntries(formData.entries());
  const branches = (
    typeof input.branches === "string" ? JSON.parse(input.branches) : []
  ) as { label: string; value: string }[];

  const data = {
    ...input,
    branches: branches.map((item) => item.value),
  };

  return await RegisterUserController(data);
};
