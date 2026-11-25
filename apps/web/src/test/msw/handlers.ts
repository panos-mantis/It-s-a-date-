import type { Role, UserDTO } from '@itsadate/shared';
import { http, HttpResponse, type RequestHandler } from 'msw';

interface FakeUser extends UserDTO {
  password: string;
}

let users: FakeUser[] = [];
let sessionEmail: string | null = null;
let nextId = 1;

const toDTO = ({ id, name, email, role }: FakeUser): UserDTO => ({ id, name, email, role });

// Fake auth backend for tests; mirrors the real API's messages.
export const authStore = {
  reset(): void {
    users = [];
    sessionEmail = null;
    nextId = 1;
  },
  addUser(input: { name: string; email: string; password: string; role?: Role }): UserDTO {
    const user: FakeUser = {
      id: `u${nextId++}`,
      name: input.name,
      email: input.email.toLowerCase(),
      password: input.password,
      role: input.role ?? 'user',
    };
    users.push(user);
    return toDTO(user);
  },
  loginAs(email: string): void {
    sessionEmail = email.toLowerCase();
  },
};

function errorResponse(status: number, code: string, message: string, details?: unknown) {
  return HttpResponse.json({ error: { code, message, details } }, { status });
}

// Default handlers shared by every test; individual tests add their own with `server.use`.
export const handlers: RequestHandler[] = [
  http.post('*/api/v1/auth/register', async ({ request }) => {
    const body = (await request.json()) as { name: string; email: string; password: string };
    if (body.email.toLowerCase().endsWith('@example.com')) {
      return errorResponse(422, 'VALIDATION', 'Check the highlighted fields', {
        issues: [{ location: 'body', path: 'email', message: 'Use a real email address' }],
      });
    }
    if (users.some((u) => u.email === body.email.toLowerCase())) {
      return errorResponse(409, 'CONFLICT', 'An account with this email already exists');
    }
    const user = authStore.addUser(body);
    authStore.loginAs(user.email);
    return HttpResponse.json(user, { status: 201 });
  }),
  http.post('*/api/v1/auth/login', async ({ request }) => {
    const body = (await request.json()) as { email: string; password: string };
    const user = users.find(
      (u) => u.email === body.email.toLowerCase() && u.password === body.password,
    );
    if (!user) return errorResponse(401, 'UNAUTHORIZED', 'Email or password is wrong');
    authStore.loginAs(user.email);
    return HttpResponse.json(toDTO(user));
  }),
  http.post('*/api/v1/auth/logout', () => {
    sessionEmail = null;
    return new HttpResponse(null, { status: 204 });
  }),
  http.get('*/api/v1/auth/me', () => {
    const user = users.find((u) => u.email === sessionEmail);
    if (!user) return errorResponse(401, 'UNAUTHORIZED', 'Please log in');
    return HttpResponse.json(toDTO(user));
  }),
];
