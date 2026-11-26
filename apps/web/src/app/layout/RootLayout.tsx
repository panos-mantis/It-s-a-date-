import type { ReactNode } from 'react';
import { Outlet, ScrollRestoration } from 'react-router';
import { Container } from '../../components/ui';
import { Header } from './Header';

export function RootLayout({ children }: { children?: ReactNode }) {
  return (
    <div className="min-h-screen bg-bg text-fg">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-30 focus:rounded-md focus:bg-accent focus:px-4 focus:py-2 focus:font-semibold focus:text-accent-on"
      >
        Skip to content
      </a>
      <Header />
      <main id="main" tabIndex={-1} className="focus:outline-none">
        <Container>{children ?? <Outlet />}</Container>
      </main>
      <ScrollRestoration />
    </div>
  );
}
