// utils/CustomError.js

class CustomError extends Error {
    constructor(message, statusCode, originalError) {
      super(message); // Inherit from the Error class
      this.statusCode = statusCode || 500; // Default to 500 if not provided
      this.message = message;
      this.originalError = originalError;
      Error.captureStackTrace(this, this.constructor);
    }
  }
  
  // You can extend this class to create more specific errors (like 400 Bad Request, 404 Not Found)
  export default CustomError;
  