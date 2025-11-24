import { IPaymentMethodReposistory } from "src/application/repositories/payment-methods.repository.interface";
import prisma from "@/app/lib/prisma/prisma";
import { DatabaseOperationError } from "src/entities/errors/common";
import {
  isPrismaError,
  isPrismaValidationError,
} from "@/app/lib/error-handler";

export const PaymentMethodRepository: IPaymentMethodReposistory = {
  getPaymentMethods: async () => {
    try {
      const payment_methods = await prisma.payment_methods.findMany();
      return payment_methods;
    } catch (error) {
      if (isPrismaError(error) || isPrismaValidationError(error)) {
        throw new DatabaseOperationError("Error getting branches", {
          cause: error.message,
        });
      }

      throw error;
    }
  },
  createPaymentMethod: async (data) => {
    try {
      const payment_method = await prisma.payment_methods.create({
        data: {
          name: data.name,
          state: data.state,
        },
      });

      return payment_method;
    } catch (error) {
      if (isPrismaError(error) || isPrismaValidationError(error)) {
        throw new DatabaseOperationError("Error creating branch!", {
          cause: error.message,
        });
      }

      throw error;
    }
  },
  updatePaymentMethod: async (payment_method_id, data) => {
    try {
      const payment_method = await prisma.payment_methods.update({
        where: { payment_method_id },
        data: {
          name: data.name,
          state: data.state,
        },
      });

      return payment_method;
    } catch (error) {
      if (isPrismaError(error) || isPrismaValidationError(error)) {
        throw new DatabaseOperationError("Error updating Branch!", {
          cause: error.message,
        });
      }

      throw error;
    }
  },
};
