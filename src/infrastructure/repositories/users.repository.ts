import { IUserRepository } from "src/application/repositories/users.repository.interface";
import prisma from "@/app/lib/prisma/prisma";
import { buildTenantWhere } from "@/app/lib/prisma/tenant-where";
import { DatabaseOperationError } from "src/entities/errors/common";
import {
  isPrismaError,
  isPrismaValidationError,
} from "@/app/lib/error-handler";
import {
  authUserWithBranchSelect,
  userWithBranchSelect,
} from "src/entities/models/User";
import { NotFoundError } from "src/entities/errors/common";

export const UserRepository: IUserRepository = {
  getUserById: async (user_id) => {
    try {
      const user = await prisma.users.findFirst({
        where: buildTenantWhere("users", { user_id }),
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
        last_activity_at: user.last_activity_at,
        branch: {
          branch_id: user.branch.branch_id,
          name: user.branch.name,
        },
        created_at: user.created_at,
        updated_at: user.updated_at,
      };
    } catch (error) {
      if (isPrismaError(error) || isPrismaValidationError(error)) {
        throw new DatabaseOperationError("Error getting user by id", {
          cause: error.message,
        });
      }

      throw error;
    }
  },
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
        last_activity_at: user.last_activity_at,
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
        last_activity_at: user.last_activity_at,
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
        last_activity_at: user.last_activity_at,
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
        last_activity_at: user.last_activity_at,
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
      const existingUser = await prisma.users.findFirst({
        where: buildTenantWhere("users", { user_id }),
        ...userWithBranchSelect,
      });

      if (!existingUser) {
        throw new NotFoundError("User not found!");
      }

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
        last_activity_at: user.last_activity_at,
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
      const existingUser = await prisma.users.findFirst({
        where: buildTenantWhere("users", { user_id }),
        ...userWithBranchSelect,
      });

      if (!existingUser) {
        throw new NotFoundError("User not found!");
      }

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
        last_activity_at: user.last_activity_at,
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
  updateLastActivity: async (user_id, last_activity_at) => {
    try {
      const user = await prisma.users.update({
        ...userWithBranchSelect,
        where: { user_id },
        data: { last_activity_at },
      });

      return {
        user_id: user.user_id,
        name: user.name,
        username: user.username,
        role: user.role,
        branch_id: user.branch_id,
        last_activity_at: user.last_activity_at,
        branch: {
          branch_id: user.branch.branch_id,
          name: user.branch.name,
        },
        created_at: user.created_at,
        updated_at: user.updated_at,
      };
    } catch (error) {
      if (isPrismaError(error) || isPrismaValidationError(error)) {
        throw new DatabaseOperationError("Error updating user activity", {
          cause: error.message,
        });
      }

      throw error;
    }
  },
};
