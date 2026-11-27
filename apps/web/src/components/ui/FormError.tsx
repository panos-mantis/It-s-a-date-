import { CircleAlert, WifiOff } from 'lucide-react';
import { NETWORK_MESSAGE } from '../../lib/api';

/** The form-level error box (a failed request or a server message). Renders nothing without one. */
export function FormError({ message }: { message?: string }) {
  if (!message) return null;
  const Icon = message === NETWORK_MESSAGE ? WifiOff : CircleAlert;
  return (
    <div
      role="alert"
      className="flex items-start gap-2.5 rounded-sm border border-danger bg-surface px-3.5 py-3 text-sm font-semibold text-danger"
    >
      <Icon aria-hidden="true" size={18} strokeWidth={1.75} className="mt-px shrink-0" />
      {message}
    </div>
  );
}

/** Announces what a busy form is doing; the node stays mounted so screen readers pick the text up. */
export function BusyStatus({
  id,
  busy,
  text,
  className = 'text-sm font-medium text-fg',
}: {
  id: string;
  busy: boolean;
  text: string;
  className?: string;
}) {
  return (
    <p id={id} role="status" className={busy ? className : 'sr-only'}>
      {busy ? text : null}
    </p>
  );
}
