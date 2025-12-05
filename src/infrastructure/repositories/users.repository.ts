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
      const user = await prisma.users.findFirst({
        where: { username },
        include: { branch: true },
      });

      return user;
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
        include: { branch: true },
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
  registerUser: async (data) => {
    try {
      return await prisma.users.create({
        include: { branch: true },
        data: {
          name: data.name,
          username: data.username,
          role: data.role,
          password: data.password,
          branch_id: data.branch_id,
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
  updateUser: async (user_id, data) => {
    try {
      return await prisma.users.update({
        include: { branch: true },
        where: { user_id },
        data: {
          name: data.name,
          username: data.username,
          role: data.role,
          branch_id: data.branch_id,
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
  updateUserPassword: async (user_id, data) => {
    try {
      return await prisma.users.update({
        include: { branch: true },
        where: { user_id },
        data: { password: data.password },
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
