import { z } from "zod";
import { Prisma } from "@prisma/client";

export const USER_ROLES = [
  "SUPER_ADMIN",
  "ADMIN",
  "OWNER",
  "CASHIER",
  "ENCODER",
] as const;

export type USER_ROLES =
  | "SUPER_ADMIN"
  | "ADMIN"
  | "OWNER"
  | "CASHIER"
  | "ENCODER";

export type UserSchema = Prisma.usersGetPayload<{
  include: { branches: { include: { branch: true } } };
}>;

export type User = {
  user_id: string;
  name: string;
  username: string;
  role: USER_ROLES;
  created_at: string;
  updated_at: string;
  branches: string[];
};

export const UsersInsertSchema = z.object({
  name: z.string().min(1),
  username: z.string().min(1),
  password: z.string().min(1),
  branches: z.array(z.string()),
  role: z.enum(["ENCODER", "CASHIER"]),
});
export type UsersInsertSchema = z.infer<typeof UsersInsertSchema>;

export const LoginUserSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

export type LoginUserSchema = z.infer<typeof LoginUserSchema>;

export const RegisterUserInputSchema = z.object({
  name: z.string().min(1),
  username: z.string().min(1),
  password: z
    .string()
    .min(6, { message: "Password must contain at least 6 characters!" }),
  role: z.enum(["CASHIER", "ENCODER"]),
  branches: z.array(z.string()),
});

export type RegisterUserInputSchema = z.infer<typeof RegisterUserInputSchema>;
