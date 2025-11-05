export class HttpError extends Error {
  status: number;
  code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export class ConfigurationError extends HttpError {
  constructor(code: string, message: string) {
    super(500, code, message);
  }
}

export const isHttpError = (error: unknown): error is HttpError => {
  return error instanceof HttpError;
};
