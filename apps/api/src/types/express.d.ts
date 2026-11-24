import type { UserDoc } from '../models/user.js';
import type { AuthContext } from './auth.js';

declare global {
  namespace Express {
    interface Locals {
      validated: { body?: unknown; query?: unknown; params?: unknown };
      auth?: AuthContext;
      /** The user loaded by requireAuth / optionalAuth. */
      user?: UserDoc;
    }
  }
}

export {};
