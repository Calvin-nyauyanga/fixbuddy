//JWT Helper functions for generating, verifying, and decoding tokens
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRE = process.env.JWT_EXPIRE || '1d';

export const generateToken = (userId, role = 'user') => {
  if (!process.env.JWT_SECRET) {
    console.warn('Warning: JWT_SECRET is not configured. Using fallback secret for development only.');
  }

  return jwt.sign({ id: userId, role: role }, JWT_SECRET, {
    expiresIn: JWT_EXPIRE,
  });
};

export const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
};

export const decodeToken = (token) => {
  return jwt.decode(token);
};