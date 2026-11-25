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
import { cn } from '../../lib/cn';

type Tone = 'info' | 'success' | 'error';
type ToastItem = { id: number; message: string; tone: Tone };
type ToastApi = { show: (message: string, opts?: { tone?: Tone }) => void };

const ToastContext = createContext<ToastApi | null>(null);

const DISMISS_MS = 5000;
const MAX_TOASTS = 3;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextId = useRef(0);
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>());

  const dismiss = useCallback((id: number) => {
    const timer = timers.current.get(id);
    if (timer) clearTimeout(timer);
    timers.current.delete(id);
    setToasts((current) => current.filter((t) => t.id !== id));
  }, []);

  const show = useCallback(
    (message: string, opts?: { tone?: Tone }) => {
      const id = nextId.current++;
      setToasts((current) => {
        const next = [...current, { id, message, tone: opts?.tone ?? 'info' }];
        const dropped = next.slice(0, Math.max(0, next.length - MAX_TOASTS));
        for (const d of dropped) {
          const timer = timers.current.get(d.id);
          if (timer) clearTimeout(timer);
          timers.current.delete(d.id);
        }
        return next.slice(-MAX_TOASTS);
      });
      timers.current.set(
        id,
        setTimeout(() => dismiss(id), DISMISS_MS),
      );
    },
    [dismiss],
  );

  useEffect(() => {
    const map = timers.current;
    return () => {
      map.forEach(clearTimeout);
      map.clear();
    };
  }, []);

  const api = useMemo(() => ({ show }), [show]);
  const polite = toasts.filter((t) => t.tone !== 'error');
  const errors = toasts.filter((t) => t.tone === 'error');

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex flex-col items-center gap-2 px-4">
        <div role="status" className="flex flex-col items-center gap-2">
          {polite.map((t) => (
            <ToastCard key={t.id} toast={t} onDismiss={dismiss} />
          ))}
        </div>
        <div role="alert" className="flex flex-col items-center gap-2">
          {errors.map((t) => (
            <ToastCard key={t.id} toast={t} onDismiss={dismiss} />
          ))}
        </div>
      </div>
    </ToastContext.Provider>
  );
}

function ToastCard({ toast, onDismiss }: { toast: ToastItem; onDismiss: (id: number) => void }) {
  return (
    <div
      className={cn(
        'pointer-events-auto flex max-w-sm items-center gap-3 rounded-md border bg-surface px-4 py-3 text-sm text-fg shadow-raised',
        toast.tone === 'error' ? 'border-danger' : 'border-border',
        'motion-safe:transition-opacity motion-safe:duration-200 motion-safe:ease-friendly',
      )}
    >
      <span>{toast.message}</span>
      <button
        type="button"
        aria-label="Dismiss"
        onClick={() => onDismiss(toast.id)}
        className="rounded-sm p-1 text-muted hover:text-fg focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-accent/30"
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
