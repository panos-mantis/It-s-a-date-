import { registerSchema } from '@itsadate/shared';
import { validationError } from '../../lib/errors.js';
import type { UserDoc } from '../../models/user.js';
import { authService } from '../auth/auth.service.js';
import { usersRepository } from './users.repository.js';

export interface CreateAdminResult {
  action: 'created' | 'promoted' | 'unchanged';
  user: UserDoc;
}

/** Ensures an admin account exists. Existing users are promoted; their password is never changed. */
export async function createAdmin(input: {
  email: string;
  name: string;
  password?: string;
}): Promise<CreateAdminResult> {
  const email = input.email.trim().toLowerCase();
  const existing = await usersRepository.findByEmail(email);
  if (existing) {
    if (existing.role === 'admin') return { action: 'unchanged', user: existing };
    const promoted = await usersRepository.setRole(String(existing._id), 'admin');
    return { action: 'promoted', user: promoted ?? existing };
  }

  const parsed = registerSchema.safeParse({
    name: input.name,
    email,
    password: input.password ?? '',
  });
  if (!parsed.success) {
    throw validationError({
      issues: parsed.error.issues.map((i) => ({
        location: 'body' as const,
        path: i.path.join('.'),
        message: i.message,
      })),
    });
  }
  const passwordHash = await authService.hashPassword(parsed.data.password);
  const user = await usersRepository.create({
    name: parsed.data.name,
    email: parsed.data.email,
    passwordHash,
    role: 'admin',
  });
  return { action: 'created', user };
}
