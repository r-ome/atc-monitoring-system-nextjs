import {
  PrismaClientKnownRequestError,
  PrismaClientValidationError,
} from "@prisma/client/runtime/library";

/**
 * Hack for a bug in PrismaClientKnownRequestError that prevents instanceof checks
 * https://github.com/prisma/prisma/issues/12128
 * @param error Any kind of actual error, object or otherwise
 * @returns Boolean indicating whether the error is a PrismaClientKnownRequestError
 */

export function isPrismaError(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  error: any
): error is PrismaClientKnownRequestError {
  return error.constructor.name === PrismaClientKnownRequestError.name;
}

export function isPrismaValidationError(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  error: any
): error is PrismaClientValidationError {
  return error.constructor.name === PrismaClientValidationError.name;
}
