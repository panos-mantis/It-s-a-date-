import { randomUUID } from 'node:crypto';
import bcrypt from 'bcryptjs';
import type { Role } from '@itsadate/shared';
import { signSession, SESSION_COOKIE } from '../features/auth/session.js';
import { UserModel, type UserDoc } from '../models/user.js';
import { testEnv } from './env.js';

/** Creates a user in the test DB and a session cookie signed with testEnv()'s default secret. */
export async function createTestUser(
  opts: { role?: Role; email?: string; name?: string; password?: string } = {},
): Promise<{ user: UserDoc; password: string; cookie: string }> {
  const password = opts.password ?? 'correct-horse';
  const user = await UserModel.create({
    name: opts.name ?? 'Test User',
    email: opts.email ?? `user-${randomUUID()}@example.com`,
    passwordHash: await bcrypt.hash(password, 4),
    role: opts.role ?? 'user',
  });
  const token = signSession({ userId: user.id as string, role: user.role }, testEnv());
  return { user, password, cookie: `${SESSION_COOKIE}=${token}` };
}
