import { IUserRepository } from "src/application/repositories/users.repository.interface";
import prisma from "@/app/lib/prisma/prisma";
import {
  DatabaseOperationError,
  NotFoundError,
} from "src/entities/errors/common";
import {
  isPrismaError,
  isPrismaValidationError,
} from "@/app/lib/error-handler";

export const UserRepository: IUserRepository = {
  getUserByUsername: async (username) => {
    try {
      return await prisma.users.findFirst({ where: { username } });
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
      return await prisma.users.findMany();
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
      return await prisma.users.create({
        data: {
          name: input.name,
          username: input.username,
          role: input.role,
          password: input.password,
        },
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
