// utils/errorHandler.js
import CustomError from './CustomError.js';

export const errorHandler = (err, req, res, next) => {
  // If the error is an instance of CustomError, handle it
  if (err instanceof CustomError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
  }

  // If it's not a CustomError, log it and send a 500 error
  console.error(err.message || err);
  return res.status(500).json({
    success: false,
    message: 'Something went wrong! Please try again later.',
  });
};
