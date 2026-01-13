class ApiError extends Error {
  constructor(statusCode = 500, message = 'Something went wrong.', isOperational = true) {
    super(message);

    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.name = 'ApiError';

    Error.captureStackTrace(this, this.constructor);
  }
}

export default ApiError;
