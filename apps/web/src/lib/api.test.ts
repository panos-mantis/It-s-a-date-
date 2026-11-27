import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';
import { server } from '../test/msw/server';
import { api, ApiError, NETWORK_MESSAGE } from './api';

describe('api client', () => {
  it('GETs JSON with credentials and drops empty query values', async () => {
    server.use(
      http.get('*/api/v1/ideas', ({ request }) => {
        const url = new URL(request.url);
        expect(url.pathname).toBe('/api/v1/ideas');
        expect(url.search).toBe('?q=sushi&page=2');

        return HttpResponse.json({ ok: true });
      }),
    );
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    const res = await api.get<{ ok: boolean }>('/ideas', {
      query: { q: 'sushi', page: 2, tag: '', budget: undefined },
    });
    expect(res).toEqual({ ok: true });
    // MSW rebuilds the Request in Node, so assert the init we pass to fetch instead.
    expect(fetchSpy).toHaveBeenCalledWith(
      expect.any(URL),
      expect.objectContaining({ credentials: 'include' }),
    );
    fetchSpy.mockRestore();
  });

  it('POSTs a JSON body', async () => {
    server.use(
      http.post('*/api/v1/echo', async ({ request }) => {
        expect(request.headers.get('content-type')).toBe('application/json');
        return HttpResponse.json(await request.json());
      }),
    );
    expect(await api.post('/echo', { a: 1 })).toEqual({ a: 1 });
  });

  it('resolves undefined on 204', async () => {
    server.use(http.post('*/api/v1/auth/logout', () => new HttpResponse(null, { status: 204 })));
    expect(await api.post('/auth/logout')).toBeUndefined();
  });

  it('throws ApiError with the server error body', async () => {
    server.use(
      http.post('*/api/v1/auth/register', () =>
        HttpResponse.json(
          { error: { code: 'CONFLICT', message: 'That email already has an account' } },
          { status: 409 },
        ),
      ),
    );
    const err = await api.post('/auth/register', {}).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect(err).toMatchObject({
      status: 409,
      code: 'CONFLICT',
      message: 'That email already has an account',
    });
    expect((err as ApiError).issues).toEqual([]);
  });

  it('exposes validation issues', async () => {
    const issue = { location: 'body', path: 'email', message: 'Use a real email address' };
    server.use(
      http.post('*/api/v1/auth/register', () =>
        HttpResponse.json(
          { error: { code: 'VALIDATION', message: 'Invalid', details: { issues: [issue] } } },
          { status: 422 },
        ),
      ),
    );
    const err = (await api.post('/auth/register', {}).catch((e: unknown) => e)) as ApiError;
    expect(err.issues[0]).toEqual(issue);
  });

  it('maps a non-JSON error body to the network message', async () => {
    server.use(
      http.get(
        '*/api/v1/ideas',
        () =>
          new HttpResponse('<html>Bad gateway</html>', {
            status: 502,
            headers: { 'Content-Type': 'text/html' },
          }),
      ),
    );
    await expect(api.get('/ideas')).rejects.toMatchObject({
      status: 502,
      code: 'INTERNAL',
      message: NETWORK_MESSAGE,
    });
  });

  it('maps a network failure', async () => {
    server.use(http.get('*/api/v1/ideas', () => HttpResponse.error()));
    await expect(api.get('/ideas')).rejects.toMatchObject({
      status: 0,
      code: 'NETWORK',
      message: NETWORK_MESSAGE,
    });
  });

  it('uploads form data without a JSON content type', async () => {
    let contentType: string | null = null;
    server.use(
      http.post('*/api/v1/uploads/image', ({ request }) => {
        contentType = request.headers.get('content-type');
        return HttpResponse.json({ ok: true }, { status: 201 });
      }),
    );
    const form = new FormData();
    form.append('image', new File(['x'], 'a.png', { type: 'image/png' }));
    await expect(api.upload('/uploads/image', form)).resolves.toEqual({ ok: true });
    expect(contentType).toMatch(/^multipart\/form-data/);
  });

  it('upload surfaces API errors as ApiError', async () => {
    server.use(
      http.post('*/api/v1/uploads/image', () =>
        HttpResponse.json({ error: { code: 'VALIDATION', message: 'Too big' } }, { status: 422 }),
      ),
    );
    await expect(api.upload('/uploads/image', new FormData())).rejects.toMatchObject({
      status: 422,
      code: 'VALIDATION',
    });
  });
});
