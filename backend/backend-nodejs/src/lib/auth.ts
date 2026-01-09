import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import type { JWTPayload, User } from '../types.js';

const SALT_ROUNDS = 12;

// Password hashing
export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}

// JWT token generation and verification
export function createAccessToken(userId: string, role: string): string {
  const payload: JWTPayload = {
    sub: userId,
    role: role,
  };

  const expiresIn: string | number = config.jwtExpiration;
  const algorithm: string = config.jwtAlgorithm;

  return jwt.sign(payload, config.jwtSecret, {
    algorithm: algorithm as jwt.Algorithm,
    expiresIn,
  } as jwt.SignOptions);
}

export function verifyAccessToken(token: string): JWTPayload {
  try {
    const payload = jwt.verify(token, config.jwtSecret, {
      algorithms: [config.jwtAlgorithm as jwt.Algorithm],
    }) as JWTPayload;
    return payload;
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
}

// Express middleware for authentication
export function authenticateToken(req: any, res: any, next: any): void {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    res.status(401).json({ detail: 'No token provided' });
    return;
  }

  try {
    const payload = verifyAccessToken(token);
    req.user = payload;
    next();
  } catch (error) {
    res.status(401).json({ detail: 'Invalid or expired token' });
  }
}
