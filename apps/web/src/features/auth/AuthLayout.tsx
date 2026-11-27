import { Lock } from 'lucide-react';
import { useId, useState, type ReactNode } from 'react';
import { Input } from '../../components/ui';

export const textLinkClasses =
  'inline-flex min-h-11 items-center rounded-sm align-middle font-semibold text-accent-ink underline underline-offset-2 hover:decoration-2';

export function AuthLayout({
  title,
  sub,
  hint,
  children,
  footer,
}: {
  /** The page's h1; may hold one `<em>` phrase. */
  title: ReactNode;
  sub: string;
  /** Why the user was sent here (from `loginHint`). */
  hint?: string | null;
  children: ReactNode;
  footer: ReactNode;
}) {
  return (
    <div className="py-6 sm:py-16">
      <section className="mx-auto flex w-full max-w-[28rem] flex-col gap-5 rounded-lg border border-border bg-surface px-5 py-6 sm:gap-6 sm:p-8">
        {hint && (
          <p className="flex items-center gap-2.5 rounded-sm bg-surface-sunk px-3.5 py-3 text-sm font-medium text-fg">
            <Lock aria-hidden="true" size={18} strokeWidth={1.75} className="shrink-0 text-muted" />
            {hint}
          </p>
        )}
        <div>
          <h1 className="text-2xl font-medium leading-tight tracking-display text-fg [&_em]:font-normal [&_em]:italic">
            {title}
          </h1>
          <p className="mt-2 text-sm text-muted">{sub}</p>
        </div>
        {children}
        <p className="text-sm text-muted">{footer}</p>
      </section>
    </div>
  );
}

type InputProps = Parameters<typeof Input>[0];

/** The kit Input with a Show / Hide button inside the field. */
export function PasswordInput({ id, ...rest }: Omit<InputProps, 'type' | 'action'>) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const [shown, setShown] = useState(false);
  return (
    <Input
      {...rest}
      id={inputId}
      type={shown ? 'text' : 'password'}
      action={
        <button
          type="button"
          aria-pressed={shown}
          aria-controls={inputId}
          onClick={() => setShown((v) => !v)}
          className="min-w-16 cursor-pointer rounded-sm px-3 text-sm font-semibold text-accent-ink hover:underline"
        >
          {shown ? 'Hide' : 'Show'}
        </button>
      }
    />
  );
}
