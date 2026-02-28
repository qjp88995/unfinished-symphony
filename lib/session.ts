import { SessionOptions } from 'iron-session';

export interface SessionData {
  isAuthenticated?: boolean;
}

export const sessionOptions: SessionOptions = {
  password: process.env.COOKIE_SECRET!,
  cookieName: 'portfolio_admin',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    httpOnly: true,
    sameSite: 'lax',
  },
};
