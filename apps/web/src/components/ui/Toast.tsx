import { X } from 'lucide-react';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../../lib/cn';

type Tone = 'info' | 'success' | 'error';
type ToastAction = { label: string; onAction: () => void };
type ToastItem = { id: number; message: string; tone: Tone; action?: ToastAction };
type ToastApi = {
  show: (message: string, opts?: { tone?: Tone; action?: ToastAction }) => void;
};
type Clock = {
  timer: ReturnType<typeof setTimeout> | null;
  remaining: number;
  startedAt: number;
  opener: HTMLElement | null;
};

const ToastContext = createContext<ToastApi | null>(null);

const PLAIN_MS = 4000;
const ACTION_MS = 8000;
const MAX_TOASTS = 3;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextId = useRef(0);
  const clocks = useRef(new Map<number, Clock>());

  const forget = useCallback((id: number) => {
    const clock = clocks.current.get(id);
    if (clock?.timer) clearTimeout(clock.timer);
    clocks.current.delete(id);
  }, []);

  const dismiss = useCallback(
    (id: number) => {
      forget(id);
      setToasts((current) => current.filter((t) => t.id !== id));
    },
    [forget],
  );

  const start = useCallback(
    (id: number) => {
      const clock = clocks.current.get(id);
      if (!clock) return;
      clock.startedAt = Date.now();
      clock.timer = setTimeout(() => dismiss(id), clock.remaining);
    },
    [dismiss],
  );

  const pause = useCallback((id: number) => {
    const clock = clocks.current.get(id);
    if (!clock?.timer) return;
    clearTimeout(clock.timer);
    clock.timer = null;
    clock.remaining = Math.max(0, clock.remaining - (Date.now() - clock.startedAt));
  }, []);

  const resume = useCallback(
    (id: number) => {
      const clock = clocks.current.get(id);
      if (clock && !clock.timer) start(id);
    },
    [start],
  );

  const show = useCallback(
    (message: string, opts?: { tone?: Tone; action?: ToastAction }) => {
      const id = nextId.current++;
      const active = document.activeElement;
      clocks.current.set(id, {
        timer: null,
        remaining: opts?.action ? ACTION_MS : PLAIN_MS,
        startedAt: 0,
        opener: active instanceof HTMLElement && active !== document.body ? active : null,
      });
      start(id);
      setToasts((current) => {
        const next = [
          ...current,
          { id, message, tone: opts?.tone ?? 'info', action: opts?.action },
        ];
        for (const d of next.slice(0, Math.max(0, next.length - MAX_TOASTS))) forget(d.id);
        return next.slice(-MAX_TOASTS);
      });
    },
    [start, forget],
  );

  const hasToasts = toasts.length > 0;
  useEffect(() => {
    if (!hasToasts) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || e.defaultPrevented) return;
      const id = [...clocks.current.keys()].pop();
      if (id === undefined) return;
      const opener = clocks.current.get(id)?.opener;
      dismiss(id);
      if (opener?.isConnected) opener.focus();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [hasToasts, dismiss]);

  useEffect(() => {
    const map = clocks.current;
    return () => {
      map.forEach((c) => {
        if (c.timer) clearTimeout(c.timer);
      });
      map.clear();
    };
  }, []);

  const api = useMemo(() => ({ show }), [show]);
  const polite = toasts.filter((t) => t.tone !== 'error');
  const errors = toasts.filter((t) => t.tone === 'error');
  const card = (t: ToastItem) => (
    <ToastCard key={t.id} toast={t} onDismiss={dismiss} onPause={pause} onResume={resume} />
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      {/* Its own child of body, which Dialog never inerts: toasts stay announced and usable while a
          dialog is open. */}
      {createPortal(
        <div
          data-toast-viewport=""
          className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex flex-col items-center gap-2 px-4"
        >
          <div role="status" className="flex flex-col items-center gap-2">
            {polite.map(card)}
          </div>
          <div role="alert" className="flex flex-col items-center gap-2">
            {errors.map(card)}
          </div>
        </div>,
        document.body,
      )}
    </ToastContext.Provider>
  );
}

function ToastCard({
  toast,
  onDismiss,
  onPause,
  onResume,
}: {
  toast: ToastItem;
  onDismiss: (id: number) => void;
  onPause: (id: number) => void;
  onResume: (id: number) => void;
}) {
  const hovered = useRef(false);
  const focused = useRef(false);
  const update = () => {
    if (hovered.current || focused.current) onPause(toast.id);
    else onResume(toast.id);
  };
  return (
    <div
      onMouseEnter={() => {
        hovered.current = true;
        update();
      }}
      onMouseLeave={() => {
        hovered.current = false;
        update();
      }}
      onFocus={() => {
        focused.current = true;
        update();
      }}
      onBlur={(e) => {
        if (e.currentTarget.contains(e.relatedTarget)) return;
        focused.current = false;
        update();
      }}
      className={cn(
        'pointer-events-auto flex max-w-sm items-center gap-3 rounded-md border bg-surface px-4 py-3 text-sm text-fg shadow-raised',
        toast.tone === 'error' ? 'border-danger' : 'border-border',
        'motion-safe:transition-opacity motion-safe:duration-200 motion-safe:ease-friendly',
      )}
    >
      <span>{toast.message}</span>
      {toast.action && (
        <button
          type="button"
          onClick={() => {
            onDismiss(toast.id);
            toast.action?.onAction();
          }}
          className="min-h-11 rounded-sm px-2 font-semibold text-accent-ink underline underline-offset-2"
        >
          {toast.action.label}
        </button>
      )}
      <button
        type="button"
        aria-label="Dismiss"
        onClick={() => onDismiss(toast.id)}
        className="flex size-11 items-center justify-center rounded-sm text-muted hover:text-fg"
      >
        <X aria-hidden="true" size={16} strokeWidth={1.75} />
      </button>
    </div>
  );
}

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside ToastProvider');
  return ctx;
}
