import { http, HttpResponse, type RequestHandler } from 'msw';
import { authStore, toDTO } from './auth-store';
import { ideasHandlers } from './ideas-handlers';

export { authStore };

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
    if (authStore.emailTaken(body.email)) {
      return errorResponse(409, 'CONFLICT', 'An account with this email already exists');
    }
    const user = authStore.addUser(body);
    authStore.loginAs(user.email);
    return HttpResponse.json(user, { status: 201 });
  }),
  http.post('*/api/v1/auth/login', async ({ request }) => {
    const body = (await request.json()) as { email: string; password: string };
    const user = authStore.findByCredentials(body.email, body.password);
    if (!user) return errorResponse(401, 'UNAUTHORIZED', 'Email or password is wrong');
    authStore.loginAs(user.email);
    return HttpResponse.json(toDTO(user));
  }),
  http.post('*/api/v1/auth/logout', () => {
    authStore.logout();
    return new HttpResponse(null, { status: 204 });
  }),
  http.get('*/api/v1/auth/me', () => {
    const user = authStore.sessionUser();
    if (!user) return errorResponse(401, 'UNAUTHORIZED', 'Please log in');
    return HttpResponse.json(user);
  }),
  ...ideasHandlers,
];
