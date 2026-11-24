import bcrypt from 'bcryptjs';
import type { LoginInput, RegisterInput } from '@itsadate/shared';
import { conflict, unauthorized } from '../../lib/errors.js';
import type { UserDoc } from '../../models/user.js';
import { usersRepository } from '../users/users.repository.js';

const BCRYPT_COST = 12;
// Fixed valid hash so an unknown email still costs one bcrypt compare (no timing oracle).
const DUMMY_HASH = '$2b$12$3AOT6eVNsanNZSZ8jh6j1uw.n8hjvrFryAoHowUcfvcj/bGwAzaBq';

const EMAIL_TAKEN = 'An account with this email already exists';

export const authService = {
  hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, BCRYPT_COST);
  },

  async register(input: RegisterInput): Promise<UserDoc> {
    if (await usersRepository.findByEmail(input.email)) throw conflict(EMAIL_TAKEN);
    const passwordHash = await authService.hashPassword(input.password);
    try {
      return await usersRepository.create({
        name: input.name,
        email: input.email,
        passwordHash,
      });
    } catch (err) {
      if ((err as { code?: unknown } | null)?.code === 11000) throw conflict(EMAIL_TAKEN);
      throw err;
    }
  },

  async login(input: LoginInput): Promise<UserDoc> {
    const user = await usersRepository.findByEmail(input.email, { withPassword: true });
    const ok = await bcrypt.compare(input.password, user?.passwordHash ?? DUMMY_HASH);
    if (!user || !ok) throw unauthorized('Email or password is wrong');
    return user;
  },
};
