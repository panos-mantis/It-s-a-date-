import type { Role } from '@itsadate/shared';

export interface AuthContext {
  userId: string;
  role: Role;
}
