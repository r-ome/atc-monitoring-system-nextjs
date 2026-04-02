import { z } from "zod";
import { Prisma } from "@prisma/client";

export const USER_ROLES = [
  "SUPER_ADMIN",
  "ADMIN",
  "OWNER",
  "CASHIER",
  "ENCODER",
  "MODERATOR",
] as const;

export type UserRole = (typeof USER_ROLES)[number];

export const userWithBranchSelect = Prisma.validator<Prisma.usersDefaultArgs>()({
  select: {
    user_id: true,
    name: true,
    username: true,
    role: true,
    branch_id: true,
    branch: {
      select: {
        branch_id: true,
        name: true,
      },
    },
    created_at: true,
    updated_at: true,
  },
});

export const authUserWithBranchSelect =
  Prisma.validator<Prisma.usersDefaultArgs>()({
    select: {
      user_id: true,
      name: true,
      username: true,
      password: true,
      role: true,
      branch_id: true,
      branch: {
        select: {
          branch_id: true,
          name: true,
        },
      },
      created_at: true,
      updated_at: true,
    },
  });

export type UserWithBranchRow = Prisma.usersGetPayload<
  typeof userWithBranchSelect
>;

export type AuthUserWithBranchRow = Prisma.usersGetPayload<
  typeof authUserWithBranchSelect
>;

export type User = {
  user_id: string;
  name: string;
  username: string;
  role: UserRole;
  branch: {
    branch_id: string;
    name: string;
  };
  created_at: string;
  updated_at: string;
};

export const createUserSchema = z.object({
  name: z.string().min(1),
  username: z.string().min(1),
  password: z.string().min(1),
  role: z.enum(["CASHIER", "ENCODER", "MODERATOR"]),
});
export type CreateUserInput = z.infer<typeof createUserSchema>;

export const loginUserSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});
export type LoginUserInput = z.infer<typeof loginUserSchema>;

export const registerUserSchema = z.object({
  name: z.string().min(1),
  username: z.string().min(1),
  branch_id: z.string(),
  password: z
    .string()
    .min(6, { message: "Password must contain at least 6 characters!" }),
  role: z.enum(["CASHIER", "ENCODER", "MODERATOR"]),
});
export type RegisterUserInput = z.infer<typeof registerUserSchema>;

export const updateUserSchema = z.object({
  name: z.string().min(1),
  username: z.string().min(1),
  branch_id: z.string(),
  role: z.enum(["CASHIER", "ENCODER", "MODERATOR"]),
});
export type UpdateUserInput = z.infer<typeof updateUserSchema>;

export const updateUserPasswordSchema = z.object({
  password: z
    .string()
    .min(6, { message: "Password must contain at least 6 characters!" }),
});
export type UpdateUserPasswordInput = z.infer<typeof updateUserPasswordSchema>;
