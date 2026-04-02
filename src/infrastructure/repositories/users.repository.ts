import { IUserRepository } from "src/application/repositories/users.repository.interface";
import prisma from "@/app/lib/prisma/prisma";
import { DatabaseOperationError } from "src/entities/errors/common";
import {
  isPrismaError,
  isPrismaValidationError,
} from "@/app/lib/error-handler";
import {
  authUserWithBranchSelect,
  userWithBranchSelect,
} from "src/entities/models/User";

export const UserRepository: IUserRepository = {
  getUserByUsername: async (username) => {
    try {
      const user = await prisma.users.findFirst({
        where: { username },
        ...userWithBranchSelect,
      });

      if (!user) {
        return null;
      }

      return {
        user_id: user.user_id,
        name: user.name,
        username: user.username,
        role: user.role,
        branch_id: user.branch_id,
        branch: {
          branch_id: user.branch.branch_id,
          name: user.branch.name,
        },
        created_at: user.created_at,
        updated_at: user.updated_at,
      };
    } catch (error) {
      if (isPrismaError(error) || isPrismaValidationError(error)) {
        throw new DatabaseOperationError("Error getting user by username", {
          cause: error.message,
        });
      }

      throw error;
    }
  },
  getAuthUserByUsername: async (username) => {
    try {
      const user = await prisma.users.findFirst({
        where: { username },
        ...authUserWithBranchSelect,
      });

      if (!user) {
        return null;
      }

      return {
        user_id: user.user_id,
        name: user.name,
        username: user.username,
        password: user.password,
        role: user.role,
        branch_id: user.branch_id,
        branch: {
          branch_id: user.branch.branch_id,
          name: user.branch.name,
        },
        created_at: user.created_at,
        updated_at: user.updated_at,
      };
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
      const users = await prisma.users.findMany({
        ...userWithBranchSelect,
      });

      return users.map((user) => ({
        user_id: user.user_id,
        name: user.name,
        username: user.username,
        role: user.role,
        branch_id: user.branch_id,
        branch: {
          branch_id: user.branch.branch_id,
          name: user.branch.name,
        },
        created_at: user.created_at,
        updated_at: user.updated_at,
      }));
    } catch (error) {
      if (isPrismaError(error) || isPrismaValidationError(error)) {
        throw new DatabaseOperationError("Error getting users", {
          cause: error.message,
        });
      }

      throw error;
    }
  },
  registerUser: async (data) => {
    try {
      const user = await prisma.users.create({
        ...userWithBranchSelect,
        data: {
          name: data.name,
          username: data.username,
          role: data.role,
          password: data.password,
          branch_id: data.branch_id,
        },
      });
      return {
        user_id: user.user_id,
        name: user.name,
        username: user.username,
        role: user.role,
        branch_id: user.branch_id,
        branch: {
          branch_id: user.branch.branch_id,
          name: user.branch.name,
        },
        created_at: user.created_at,
        updated_at: user.updated_at,
      };
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
      const user = await prisma.users.update({
        ...userWithBranchSelect,
        where: { user_id },
        data: {
          name: data.name,
          username: data.username,
          role: data.role,
          branch_id: data.branch_id,
        },
      });
      return {
        user_id: user.user_id,
        name: user.name,
        username: user.username,
        role: user.role,
        branch_id: user.branch_id,
        branch: {
          branch_id: user.branch.branch_id,
          name: user.branch.name,
        },
        created_at: user.created_at,
        updated_at: user.updated_at,
      };
    } catch (error) {
      if (isPrismaError(error) || isPrismaValidationError(error)) {
        throw new DatabaseOperationError("Error updating user", {
          cause: error.message,
        });
      }
      throw error;
    }
  },
  updateUserPassword: async (user_id, data) => {
    try {
      const user = await prisma.users.update({
        ...userWithBranchSelect,
        where: { user_id },
        data: { password: data.password },
      });
      return {
        user_id: user.user_id,
        name: user.name,
        username: user.username,
        role: user.role,
        branch_id: user.branch_id,
        branch: {
          branch_id: user.branch.branch_id,
          name: user.branch.name,
        },
        created_at: user.created_at,
        updated_at: user.updated_at,
      };
    } catch (error) {
      if (isPrismaError(error) || isPrismaValidationError(error)) {
        throw new DatabaseOperationError("Error updating user password", {
          cause: error.message,
        });
      }
      throw error;
    }
  },
};
