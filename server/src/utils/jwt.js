//JWT Helper functions for generating, verifying, and decoding tokens
import jwt from 'jsonwebtoken';

export const generateToken = (userId) => {
  const secret = process.env.JWT_SECRET;
  const expiresIn = process.env.JWT_EXPIRE || '1d';
  if (!secret) {
    throw new Error('JWT secret is not configured');
  }
  return jwt.sign({ id: userId }, secret, {
    expiresIn,
  });
};

export const verifyToken = (token) => {
  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) return null;
    return jwt.verify(token, secret);
  } catch (error) {
    return null;
  }
};

export const decodeToken = (token) => {
  return jwt.decode(token);
};