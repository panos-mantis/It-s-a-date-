/// <reference types="@testing-library/jest-dom/vitest" />
import * as matchers from '@testing-library/jest-dom/matchers';
import { cleanup } from '@testing-library/react';
import { afterEach, expect } from 'vitest';

// Explicit extend (instead of '@testing-library/jest-dom/vitest') so the matchers attach to the
// same `expect` instance the tests use.
expect.extend(matchers);

// Vitest `globals` is off, so Testing Library's automatic cleanup is never registered.
afterEach(() => cleanup());
