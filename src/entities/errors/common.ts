class BaseError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = this.constructor.name;
  }
}

export class DatabaseOperationError extends BaseError {
  declare readonly cause?: string;
  constructor(message: string, options?: { cause?: string }) {
    super(message, options as ErrorOptions);
  }
}
export class NotFoundError extends BaseError {
  declare readonly cause?: string;
  constructor(message: string, options?: { cause?: string }) {
    super(message, options as ErrorOptions);
  }
}
export class InputParseError extends BaseError {
  declare readonly cause?: Record<string, string[]>;
  constructor(message: string, options?: { cause?: Record<string, string[]> }) {
    super(message, options as ErrorOptions);
  }
}
