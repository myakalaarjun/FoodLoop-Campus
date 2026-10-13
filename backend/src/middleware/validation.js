import { validationResult } from 'express-validator';

export function validate(req, _res, next) {
  const result = validationResult(req);
  if (!result.isEmpty()) {
    return next(Object.assign(new Error(result.array().map(item => item.msg).join(', ')), { status: 400 }));
  }
  next();
}
