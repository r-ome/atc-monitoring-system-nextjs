"use server";

import {
  authorizeAction,
  runWithUserContext,
} from "@/app/lib/protected-action";
import { GetUserByUsernameController } from "src/controllers/users/get-user-by-username.controller";
import { GetUsersController } from "src/controllers/users/get-users.controller";
import { DeleteUserController } from "src/controllers/users/delete-user.controller";
import { RegisterUserController } from "src/controllers/users/register-user.controller";
import { UpdateUserController } from "src/controllers/users/update-user.controller";
import { UpdateUserPasswordController } from "src/controllers/users/update-user-password.controller";
import { err } from "src/entities/models/Result";

export const getUserByUsername = async (username: string) => {
  const auth = await authorizeAction({
    allowedRoles: ["OWNER", "SUPER_ADMIN"],
  });
  if (!auth.ok) return auth;

  return await runWithUserContext(auth.value, async () =>
    GetUserByUsernameController(username),
  );
};

export const getUsers = async () => {
  const auth = await authorizeAction({
    allowedRoles: ["OWNER", "SUPER_ADMIN"],
  });
  if (!auth.ok) return auth;

  return await runWithUserContext(auth.value, async () => GetUsersController());
};

export const registerUser = async (formData: FormData) => {
  const auth = await authorizeAction({
    allowedRoles: ["OWNER", "SUPER_ADMIN"],
  });
  if (!auth.ok) return auth;

  const input = Object.fromEntries(formData.entries());
  return await runWithUserContext(auth.value, async () =>
    RegisterUserController(input),
  );
};

export const updateUser = async (user_id: string, formData: FormData) => {
  const auth = await authorizeAction({
    allowedRoles: ["OWNER", "SUPER_ADMIN"],
  });
  if (!auth.ok) return auth;

  const input = Object.fromEntries(formData.entries());
  return await runWithUserContext(auth.value, async () =>
    UpdateUserController(user_id, input),
  );
};

export const updateUserPassword = async (
  user_id: string,
  formData: FormData
) => {
  const auth = await authorizeAction({
    allowedRoles: ["OWNER", "SUPER_ADMIN"],
  });
  if (!auth.ok) return auth;

  const input = Object.fromEntries(formData.entries());
  return await runWithUserContext(auth.value, async () =>
    UpdateUserPasswordController(user_id, input),
  );
};

export const deleteUser = async (user_id: string) => {
  const auth = await authorizeAction({
    allowedRoles: ["OWNER", "SUPER_ADMIN"],
  });
  if (!auth.ok) return auth;

  if (auth.value.id === user_id) {
    return err({
      message: "Unauthorized",
      cause: "You cannot delete your own account.",
    });
  }

  return await runWithUserContext(auth.value, async () =>
    DeleteUserController(user_id),
  );
};
