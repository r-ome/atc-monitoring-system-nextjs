import { IPaymentMethodRepository } from "src/application/repositories/payment-methods.repository.interface";
import prisma from "@/app/lib/prisma/prisma";
import { DatabaseOperationError } from "src/entities/errors/common";
import {
  isPrismaError,
  isPrismaValidationError,
} from "@/app/lib/error-handler";

export const PaymentMethodRepository: IPaymentMethodRepository = {
  getPaymentMethods: async () => {
    try {
      return await prisma.payment_methods.findMany({
        orderBy: { name: "asc" },
      });
    } catch (error) {
      if (isPrismaError(error) || isPrismaValidationError(error)) {
        throw new DatabaseOperationError("Error getting payment methods", {
          cause: error.message,
        });
      }

      throw error;
    }
  },
  getEnabledPaymentMethods: async () => {
    try {
      return await prisma.payment_methods.findMany({
        where: { state: "ENABLED" },
        orderBy: { name: "asc" },
      });
    } catch (error) {
      if (isPrismaError(error) || isPrismaValidationError(error)) {
        throw new DatabaseOperationError("Error getting payment methods", {
          cause: error.message,
        });
      }

      throw error;
    }
  },
  createPaymentMethod: async (data) => {
    try {
      return await prisma.payment_methods.create({
        data: {
          name: data.name,
          state: data.state,
        },
      });
    } catch (error) {
      if (isPrismaError(error) || isPrismaValidationError(error)) {
        throw new DatabaseOperationError("Error creating payment method!", {
          cause: error.message,
        });
      }

      throw error;
    }
  },
  updatePaymentMethod: async (payment_method_id, data) => {
    try {
      return await prisma.payment_methods.update({
        where: { payment_method_id },
        data: {
          name: data.name,
          state: data.state,
        },
      });
    } catch (error) {
      if (isPrismaError(error) || isPrismaValidationError(error)) {
        throw new DatabaseOperationError("Error updating payment method!", {
          cause: error.message,
        });
      }

      throw error;
    }
  },
};
