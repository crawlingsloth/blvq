import { create, verify } from 'https://deno.land/x/djwt@v3.0.1/mod.ts';

const JWT_SECRET = Deno.env.get('JWT_SECRET') || 'your-secret-key-must-be-at-least-32-characters-long-change-this';
const JWT_ALGORITHM = 'HS256';

// Password hashing using Web Crypto API (built-in, no dependencies)
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const passwordHash = await hashPassword(password);
  return passwordHash === hash;
}

// JWT token generation and verification
export async function createAccessToken(userId: string, role: string): Promise<string> {
  const payload = {
    sub: userId,
    role: role,
    exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24 hours
  };

  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(JWT_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  return await create({ alg: JWT_ALGORITHM, typ: 'JWT' }, payload, key);
}

export async function verifyAccessToken(token: string): Promise<any> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(JWT_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['verify']
  );

  try {
    const payload = await verify(token, key);
    return payload;
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
}

// Extract and verify token from request
export async function authenticateRequest(req: Request): Promise<any> {
  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('No token provided');
  }

  const token = authHeader.substring(7);
  return await verifyAccessToken(token);
}
