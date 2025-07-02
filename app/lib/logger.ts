import { InputParseError } from "src/entities/errors/common";
import winston from "winston";

const { combine, timestamp, align, colorize, printf } = winston.format;

export const winston_logger = winston.createLogger({
  level: "http",
  format: combine(
    colorize({ all: true }),
    timestamp({ format: "YYYY-MM-DD hh:mm:ss A" }),
    align(),
    printf(function (info) {
      return `[${info.timestamp}] ${info.level}: ${info.message}`;
    })
  ),
  transports: new winston.transports.Console(),
});

export const logger = (func_name: string, error: unknown) => {
  const formatted_error =
    error instanceof Error
      ? {
          message: error?.message,
          cause:
            error instanceof InputParseError
              ? JSON.stringify(error?.cause)
              : error?.cause,
        }
      : { message: String(error) };

  winston_logger.error({
    func_name,
    error: formatted_error,
  });
};
