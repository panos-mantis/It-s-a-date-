// @vitest-environment node
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const read = (rel: string) => readFileSync(fileURLToPath(new URL(rel, import.meta.url)), 'utf8');
const tokensCss = read(
  '../../../.open-design/design-systems/style-tiles-for-it-s-a-date-a-web-app-where-peop/tokens.css',
);
const css = read('../src/styles/index.css');

const collect = (source: string): Record<string, string> => {
  const out: Record<string, string> = {};
  for (const m of source.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) out[m[1]!] = m[2]!;
  return out;
};
// Prettier rewrites CSS quotes to single quotes and may wrap values: compare quote- and whitespace-insensitively.
const norm = (v: string | undefined) =>
  (v ?? '<missing>').toLowerCase().replace(/'/g, '"').replace(/\s+/g, ' ').trim();

const tokens = collect(tokensCss);
const theme = collect(css);

const MAP: Record<string, string> = {
  '--bg': '--color-bg',
  '--surface': '--color-surface',
  '--surface-sunk': '--color-surface-sunk',
  '--fg': '--color-fg',
  '--muted': '--color-muted',
  '--border': '--color-border',
  '--accent': '--color-accent',
  '--accent-on': '--color-accent-on',
  '--accent-hover': '--color-accent-hover',
  '--accent-ink': '--color-accent-ink',
  '--accent-soft': '--color-accent-soft',
  '--success': '--color-success',
  '--warn': '--color-warn',
  '--danger': '--color-danger',
  '--overlay': '--color-overlay',
  '--on-danger': '--color-on-danger',
  '--scrim': '--color-scrim',
  '--focus-ring': '--color-focus-ring',
  '--font-display': '--font-display',
  '--font-body': '--font-body',
  '--font-mono': '--font-mono',
  '--text-xs': '--text-xs',
  '--text-sm': '--text-sm',
  '--text-base': '--text-base',
  '--text-lg': '--text-lg',
  '--text-xl': '--text-xl',
  '--text-2xl': '--text-2xl',
  '--text-3xl': '--text-3xl',
  '--text-4xl': '--text-4xl',
  '--leading-body': '--leading-body',
  '--leading-tight': '--leading-tight',
  '--tracking-display': '--tracking-display',
  '--radius-sm': '--radius-sm',
  '--radius-md': '--radius-md',
  '--radius-lg': '--radius-lg',
  '--radius-pill': '--radius-pill',
  '--elev-raised': '--shadow-raised',
  '--elev-search': '--shadow-search',
  '--container-max': '--container-page',
};
// Used through Tailwind's 4px spacing scale, the Container component or the font-soft utility instead:
const NOT_THEME = [/^--space-\d$/, /^--section-y-/, /^--container-gutter-/, /^--soft$/];

describe('tailwind theme', () => {
  it('maps every design token 1:1 into the Tailwind theme', () => {
    for (const [token, themeVar] of Object.entries(MAP)) {
      const expected =
        token === '--font-display'
          ? '"Fraunces Variable", ' + tokens[token]
          : token === '--font-body'
            ? '"DM Sans Variable", ' + tokens[token]
            : tokens[token];
      expect(norm(theme[themeVar]), `${token} -> ${themeVar}`).toBe(norm(expected));
    }
  });
  it('has no unmapped design token', () => {
    for (const name of Object.keys(tokens))
      expect(name in MAP || NOT_THEME.some((r) => r.test(name)), name).toBe(true);
  });
  it('removes the default palette', () => expect(css).toMatch(/--color-\*:\s*initial/));
  it('defines font-soft with the SOFT axis on', () =>
    expect(norm(css)).toMatch(/@utility font-soft[^}]*"soft" 100, "wonk" 0/));
});
