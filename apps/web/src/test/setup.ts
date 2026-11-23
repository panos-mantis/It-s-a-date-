/// <reference types="@testing-library/jest-dom/vitest" />
import * as matchers from '@testing-library/jest-dom/matchers';
import { expect } from 'vitest';

// Explicit extend (instead of '@testing-library/jest-dom/vitest') so the matchers attach to the
// same `expect` instance regardless of drive-letter casing when launched from the repo root on Windows.
expect.extend(matchers);
