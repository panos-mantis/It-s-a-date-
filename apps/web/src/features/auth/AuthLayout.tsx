import type { ReactNode } from 'react';
import { Container } from '../../components/ui';

export function AuthLayout({
  title,
  children,
  footer,
}: {
  title: string;
  children: ReactNode;
  footer: ReactNode;
}) {
  return (
    <Container className="py-10 sm:py-16">
      <section className="mx-auto w-full max-w-[28rem] rounded-lg border border-border bg-surface p-6 sm:p-8">
        <h1 className="font-display text-2xl text-fg">{title}</h1>
        <div className="mt-6">{children}</div>
        <p className="mt-6 text-sm text-muted">{footer}</p>
      </section>
    </Container>
  );
}

export function FormError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <div
      role="alert"
      className="rounded-sm border border-danger px-3.5 py-3 text-sm font-semibold text-danger"
    >
      {message}
    </div>
  );
}
