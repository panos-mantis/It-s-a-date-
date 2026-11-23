import type { AuthContext } from './auth.js';

declare global {
  namespace Express {
    interface Locals {
      validated: { body?: unknown; query?: unknown; params?: unknown };
      auth?: AuthContext;
    }
  }
}

export {};
