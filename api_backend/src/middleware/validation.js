import { validationResult } from 'express-validator';
import { sendError } from '../utils/responseHelper.js';

export const validate = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const extractedErrors = {};
    errors.array().forEach(err => {
      extractedErrors[err.path] = err.msg;
    });

    return sendError(res, 'Validation failed', 400, extractedErrors);
  }
  
  next();
};
