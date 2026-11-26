import type { Role, UserDTO } from '@itsadate/shared';
import { userFixtures } from '../fixtures/users';

export interface FakeUser extends UserDTO {
  password: string;
}

let users: FakeUser[] = [];
let sessionEmail: string | null = null;
let nextId = 1;

export const toDTO = ({ id, name, email, role }: FakeUser): UserDTO => ({ id, name, email, role });

// Fake auth backend for tests; mirrors the real API's messages.
export const authStore = {
  reset(): void {
    users = [];
    sessionEmail = null;
    nextId = 1;
  },
  addUser(input: { name: string; email: string; password: string; role?: Role }): UserDTO {
    const email = input.email.toLowerCase();
    const user: FakeUser = {
      // Fixture people keep their fixture id, so a session user matches the ideas they created.
      id:
        userFixtures.find((u) => u.email === email)?.id ??
        `64d${String(nextId++).padStart(21, '0')}`,
      name: input.name,
      email,
      password: input.password,
      role: input.role ?? 'user',
    };
    users.push(user);
    return toDTO(user);
  },
  loginAs(email: string): void {
    sessionEmail = email.toLowerCase();
  },
  logout(): void {
    sessionEmail = null;
  },
  findByCredentials(email: string, password: string): FakeUser | undefined {
    return users.find((u) => u.email === email.toLowerCase() && u.password === password);
  },
  emailTaken(email: string): boolean {
    return users.some((u) => u.email === email.toLowerCase());
  },
  /** The logged-in user, or null. */
  sessionUser(): UserDTO | null {
    const user = users.find((u) => u.email === sessionEmail);
    return user ? toDTO(user) : null;
  },
};
