/// <reference types="@testing-library/jest-dom/vitest" />
import * as matchers from '@testing-library/jest-dom/matchers';
import { cleanup } from '@testing-library/react';
import { afterAll, afterEach, beforeAll, expect } from 'vitest';
import { authStore } from './msw/handlers';
import { server } from './msw/server';

// Explicit extend (instead of '@testing-library/jest-dom/vitest') so the matchers attach to the
// same `expect` instance the tests use.
expect.extend(matchers);

// jsdom does not implement scrollTo (ScrollRestoration calls it).
if (typeof window !== 'undefined') window.scrollTo = () => undefined;

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }));

// Vitest `globals` is off, so Testing Library's automatic cleanup is never registered.
afterEach(() => {
  cleanup();
  server.resetHandlers();
  authStore.reset();
});

afterAll(() => server.close());
