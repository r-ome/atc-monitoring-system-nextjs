import { IUserRepository } from "src/application/repositories/users.repository.interface";
import prisma from "@/app/lib/prisma/prisma";
import { DatabaseOperationError } from "src/entities/errors/common";
import {
  isPrismaError,
  isPrismaValidationError,
} from "@/app/lib/error-handler";

export const UserRepository: IUserRepository = {
  getUserByUsername: async (username) => {
    try {
      return await prisma.users.findFirst({
        where: { username },
        include: { branches: { include: { branch: true } } },
      });
    } catch (error) {
      if (isPrismaError(error) || isPrismaValidationError(error)) {
        throw new DatabaseOperationError("Error getting user by username", {
          cause: error.message,
        });
      }

      throw error;
    }
  },
  getUsers: async () => {
    try {
      return await prisma.users.findMany({
        include: { branches: { include: { branch: true } } },
      });
    } catch (error) {
      if (isPrismaError(error) || isPrismaValidationError(error)) {
        throw new DatabaseOperationError("Error getting branch", {
          cause: error.message,
        });
      }

      throw error;
    }
  },
  registerUser: async (input) => {
    try {
      return await prisma.$transaction(async (tx) => {
        const user = await tx.users.create({
          data: {
            name: input.name,
            username: input.username,
            role: input.role,
            password: input.password,
          },
        });

        await tx.users_branches.createMany({
          data: input.branches.map((branch_id) => ({
            user_id: user.user_id,
            branch_id,
          })),
        });

        const created = await tx.users.findFirst({
          where: { user_id: user.user_id },
          include: { branches: true },
        });

        if (!created) {
          throw new DatabaseOperationError("error creating user", {
            cause: "Nothing created",
          });
        }

        return created;
      });
    } catch (error) {
      if (isPrismaError(error) || isPrismaValidationError(error)) {
        throw new DatabaseOperationError("Error registering user", {
          cause: error.message,
        });
      }
      throw error;
    }
  },
};
