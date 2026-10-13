import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export async function authenticate(req, _res, next) {
  try {
    const bearer = req.headers.authorization?.startsWith('Bearer ')
      ? req.headers.authorization.slice(7)
      : null;
    const token = req.cookies?.foodloopToken || bearer;
    if (!token) return next(Object.assign(new Error('Authentication required.'), { status: 401 }));
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.sub);
    if (!user || !user.active) return next(Object.assign(new Error('Account is unavailable.'), { status: 401 }));
    req.user = user;
    next();
  } catch (error) {
    next(error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError'
      ? Object.assign(new Error('Invalid or expired session.'), { status: 401 })
      : error);
  }
}

export function allowRoles(...roles) {
  return (req, _res, next) => roles.includes(req.user.role)
    ? next()
    : next(Object.assign(new Error('You do not have permission to perform this action.'), { status: 403 }));
}
