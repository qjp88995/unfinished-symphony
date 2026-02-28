import { SessionOptions } from 'iron-session';

export interface SessionData {
  isAuthenticated?: boolean;
}

const cookieSecret = process.env.COOKIE_SECRET;
if (!cookieSecret || cookieSecret.length < 32) {
  throw new Error('COOKIE_SECRET environment variable is required and must be at least 32 characters');
}

export const sessionOptions: SessionOptions = {
  password: cookieSecret,
  cookieName: 'portfolio_admin',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    httpOnly: true,
    sameSite: 'lax',
  },
};
