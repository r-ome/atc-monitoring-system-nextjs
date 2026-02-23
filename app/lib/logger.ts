import { InputParseError } from "src/entities/errors/common";
import winston from "winston";

const { combine, timestamp, align, colorize, printf } = winston.format;

export const winston_logger = winston.createLogger({
  level: "http",
  format: combine(
    colorize({ all: true }),
    timestamp({ format: "YYYY-MM-DD hh:mm:ss A" }),
    align(),
    printf(function ({ timestamp, level, message, ...meta }) {
      return `[${timestamp}] ${level}: ${message} ${Object.keys(meta).length ? JSON.stringify(meta) : ""}`;
    }),
  ),
  transports: new winston.transports.Console(),
});

export const logger = (
  func_name: string,
  message: unknown,
  type: "info" | "warn" | "error" = "error",
  context?: Record<string, unknown>,
) => {
  if (type === "info") {
    winston_logger.info({
      func_name,
      data: message,
      ...context,
    });
    return;
  }

  const formatted_error =
    message instanceof Error
      ? {
          message: message.message,
          stack: message.stack,
          cause:
            message instanceof InputParseError
              ? JSON.stringify(message.cause)
              : message.cause,
        }
      : { message: String(message) };

  if (type === "warn") {
    winston_logger.warn({
      func_name,
      error: formatted_error,
      ...context,
    });
    return;
  }

  winston_logger.error({
    func_name,
    error: formatted_error,
    ...context,
  });
};
