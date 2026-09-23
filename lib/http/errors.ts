/** Typed API errors. `with-error-handling.ts` catches these and serializes
 * them to the standard { statusCode, message, error } envelope — the Next.js
 * equivalent of NestJS's built-in HttpException hierarchy. */
export class ApiHttpException extends Error {
  statusCode: number;
  error: string;

  constructor(statusCode: number, message: string, error?: string) {
    super(message);
    this.statusCode = statusCode;
    this.error = error ?? defaultErrorName(statusCode);
  }
}

function defaultErrorName(statusCode: number): string {
  switch (statusCode) {
    case 400:
      return "Bad Request";
    case 401:
      return "Unauthorized";
    case 403:
      return "Forbidden";
    case 404:
      return "Not Found";
    case 409:
      return "Conflict";
    case 422:
      return "Unprocessable Entity";
    case 429:
      return "Too Many Requests";
    default:
      return "Internal Server Error";
  }
}

export class BadRequestError extends ApiHttpException {
  constructor(message = "Bad request") {
    super(400, message);
  }
}

export class UnauthorizedError extends ApiHttpException {
  constructor(message = "Authentication required") {
    super(401, message);
  }
}

export class ForbiddenError extends ApiHttpException {
  constructor(message = "You do not have permission to perform this action") {
    super(403, message);
  }
}

export class NotFoundError extends ApiHttpException {
  constructor(message = "Resource not found") {
    super(404, message);
  }
}

export class ConflictError extends ApiHttpException {
  constructor(message = "Resource conflict") {
    super(409, message);
  }
}

export class UnprocessableEntityError extends ApiHttpException {
  constructor(message = "Unprocessable entity") {
    super(422, message);
  }
}

export class TooManyRequestsError extends ApiHttpException {
  constructor(message = "Too many requests, please try again later") {
    super(429, message);
  }
}
