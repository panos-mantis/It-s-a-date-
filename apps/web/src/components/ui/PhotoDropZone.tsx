import { CircleAlert, ImagePlus, RefreshCw, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useId, useRef, useState, type DragEvent } from 'react';
import { ApiError } from '../../lib/api';
import { cn } from '../../lib/cn';
import { Button } from './Button';

export interface PhotoValue {
  url: string;
  publicId: string;
}

type UploadFn = (input: { file: File; onProgress?: (pct: number) => void }) => Promise<PhotoValue>;

const MAX_BYTES = 5 * 1024 * 1024;
const TYPES = ['image/jpeg', 'image/png', 'image/webp'];
// HANDOFF §3, Share upload errors (R23).
const REJECTED_MESSAGE = "That photo didn't upload. Try a JPEG, PNG or WebP under 5 MB.";

type Status = 'idle' | 'uploading' | 'done' | 'dropped' | 'rejected';

interface Local {
  file: File;
  previewUrl: string;
}

function formatSize(bytes: number): string {
  return bytes >= 1024 * 1024
    ? `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

/**
 * The photo field: a drop zone, then a 4:3 preview with Replace and Remove. A picked file uploads
 * at once. `value` is the uploaded image (or null while there is none).
 */
export function PhotoDropZone({
  value,
  onChange,
  upload,
  onUploadingChange,
  error,
  label = 'Photo',
  removable = true,
}: {
  value: PhotoValue | null;
  onChange: (value: PhotoValue | null) => void;
  /** Sends the file (the `mutateAsync` of `useUploadImage`). */
  upload: UploadFn;
  /** Tells the form when an upload starts and ends, so it can hold the submit button. */
  onUploadingChange?: (uploading: boolean) => void;
  /** A message from outside (a form check or the API), shown when the field has none of its own. */
  error?: string;
  label?: string;
  /** False hides Remove: Admin Edit can replace a photo but the API can't clear one. */
  removable?: boolean;
}) {
  const id = useId();
  const labelId = `${id}-label`;
  const addId = `${id}-add`;
  const helpId = `${id}-help`;
  const errorId = `${id}-error`;
  const inputRef = useRef<HTMLInputElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const fileId = `${id}-file`;
  const localRef = useRef<Local | null>(null);
  const attemptRef = useRef(0);
  const focusReplaceRef = useRef(false);
  const unmountedRef = useRef(false);

  const [local, setLocal] = useState<Local | null>(null);
  const [status, setStatus] = useState<Status>('idle');
  const [progress, setProgress] = useState(0);
  const [over, setOver] = useState(false);

  const uploading = status === 'uploading';
  const onUploadingRef = useRef(onUploadingChange);
  useEffect(() => {
    onUploadingRef.current = onUploadingChange;
  });
  const reportedRef = useRef(false);
  useEffect(() => {
    if (reportedRef.current === uploading) return;
    reportedRef.current = uploading;
    onUploadingRef.current?.(uploading);
  }, [uploading]);

  const releasePreview = useCallback(() => {
    if (localRef.current) URL.revokeObjectURL(localRef.current.previewUrl);
    localRef.current = null;
  }, []);

  useEffect(() => {
    unmountedRef.current = false;
    return () => {
      unmountedRef.current = true;
      releasePreview();
    };
  }, [releasePreview]);

  // The drop zone had focus; once it is gone, focus the Replace button (F1).
  useEffect(() => {
    if (local && focusReplaceRef.current) {
      focusReplaceRef.current = false;
      rootRef.current?.querySelector<HTMLElement>('[data-replace]')?.focus();
    }
  }, [local]);

  const send = useCallback(
    (file: File) => {
      attemptRef.current += 1;
      const attempt = attemptRef.current;
      setStatus('uploading');
      setProgress(0);
      onChange(null);
      upload({
        file,
        onProgress: (pct) => {
          if (attempt === attemptRef.current && !unmountedRef.current) setProgress(pct);
        },
      }).then(
        (image) => {
          if (attempt !== attemptRef.current || unmountedRef.current) return;
          setStatus('done');
          onChange(image);
        },
        (err: unknown) => {
          if (attempt !== attemptRef.current || unmountedRef.current) return;
          const dropped = !(err instanceof ApiError) || err.code === 'NETWORK' || err.status >= 500;
          if (dropped) {
            setStatus('dropped');
          } else {
            releasePreview();
            setLocal(null);
            setStatus('rejected');
          }
        },
      );
    },
    [onChange, releasePreview, upload],
  );

  const pickFile = (file: File | undefined) => {
    if (!file) return;
    attemptRef.current += 1; // anything still uploading is now stale
    releasePreview();
    if (!TYPES.includes(file.type) || file.size > MAX_BYTES) {
      setLocal(null);
      setStatus('rejected');
      onChange(null);
      return;
    }
    const next = { file, previewUrl: URL.createObjectURL(file) };
    localRef.current = next;
    focusReplaceRef.current = true;
    setLocal(next);
    send(file);
  };

  const remove = () => {
    attemptRef.current += 1;
    releasePreview();
    setLocal(null);
    setStatus('idle');
    onChange(null);
    // The preview (and the button that had focus) is gone; the drop zone's input takes over.
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setOver(false);
    pickFile(e.dataTransfer.files[0]);
  };

  const showPreview = local !== null || (value !== null && status !== 'rejected');
  const previewSrc = local?.previewUrl ?? value?.url ?? '';
  const message =
    status === 'rejected'
      ? REJECTED_MESSAGE
      : status === 'dropped' && local
        ? `${local.file.name} didn't finish uploading.`
        : error;
  const invalid = Boolean(message);
  const internalError = status === 'rejected' || status === 'dropped';

  return (
    <div ref={rootRef} className="flex min-w-0 flex-col gap-1.5">
      <span id={labelId} className="text-sm font-semibold text-fg">
        {label}
      </span>
      <input
        ref={inputRef}
        id={fileId}
        type="file"
        accept={TYPES.join(',')}
        // In the preview the picker is only opened by Replace; it must not be a tab stop.
        hidden={showPreview}
        className="peer sr-only"
        aria-labelledby={`${labelId} ${addId}`}
        aria-describedby={invalid ? `${helpId} ${errorId}` : helpId}
        aria-invalid={invalid || undefined}
        onChange={(e) => {
          pickFile(e.target.files?.[0]);
          e.target.value = '';
        }}
      />
      {showPreview ? (
        <div>
          <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-surface-sunk">
            <img
              src={previewSrc}
              alt={local ? `Your photo: ${local.file.name}` : 'Your photo'}
              width={800}
              height={600}
              className={cn(
                'size-full object-cover',
                (uploading || status === 'dropped') && 'opacity-55',
              )}
            />
          </div>
          {uploading && (
            <div className="mt-3 flex flex-col gap-1.5">
              <div className="flex justify-between gap-3 text-sm">
                <span>Uploading {local?.file.name}…</span>
                <span className="font-semibold tabular-nums">{progress}%</span>
              </div>
              <div
                role="progressbar"
                aria-label="Photo upload"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={progress}
                className="h-1.5 overflow-hidden rounded-pill bg-surface-sunk"
              >
                <div
                  className="h-full rounded-pill bg-fg motion-safe:transition-[width] motion-safe:duration-150 motion-safe:ease-friendly"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
          {message && (
            <p
              id={errorId}
              role={internalError ? 'alert' : undefined}
              className="mt-2 flex items-start gap-1.5 text-xs text-danger"
            >
              <CircleAlert aria-hidden="true" size={14} strokeWidth={1.75} className="mt-0.5" />
              {message}
            </p>
          )}
          <div className="mt-2 flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
            <p className="min-w-0 text-sm text-muted [overflow-wrap:anywhere]">
              {local && (
                <>
                  <strong className="font-medium text-fg">{local.file.name}</strong> ·{' '}
                  {formatSize(local.file.size)}
                </>
              )}
            </p>
            <div className="flex items-center gap-2">
              {status === 'dropped' && local && (
                <Button
                  variant="secondary"
                  size="sm"
                  aria-describedby={errorId}
                  onClick={() => send(local.file)}
                >
                  <RefreshCw aria-hidden="true" size={16} strokeWidth={1.75} />
                  Try again
                </Button>
              )}
              <Button
                data-replace=""
                variant="secondary"
                size="sm"
                onClick={() => inputRef.current?.click()}
              >
                <RefreshCw aria-hidden="true" size={16} strokeWidth={1.75} />
                Replace
              </Button>
              {removable && (
                <Button variant="ghost" size="sm" onClick={remove}>
                  <Trash2 aria-hidden="true" size={16} strokeWidth={1.75} />
                  Remove
                </Button>
              )}
            </div>
          </div>
        </div>
      ) : (
        <>
          <label
            htmlFor={fileId}
            onDragOver={(e) => {
              e.preventDefault();
              setOver(true);
            }}
            onDragLeave={() => setOver(false)}
            onDrop={onDrop}
            className={cn(
              'flex min-h-[200px] cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-[1.5px] px-4 py-6 text-center sm:min-h-[240px] sm:px-6 sm:py-8',
              'motion-safe:transition-colors motion-safe:duration-150 motion-safe:ease-friendly',
              invalid ? 'border-solid border-danger' : 'border-dashed border-muted',
              over ? 'bg-surface-sunk' : 'bg-surface hover:bg-surface-sunk',
              'peer-focus-visible:border-accent-ink peer-focus-visible:ring-[3px] peer-focus-visible:ring-focus-ring',
            )}
          >
            <ImagePlus
              aria-hidden="true"
              size={32}
              strokeWidth={1.75}
              className={invalid ? 'text-danger' : 'text-muted'}
            />
            <span id={addId} className="text-base font-semibold">
              Add a photo
            </span>
            <span className="text-sm text-muted">
              Drag it here or <u className="text-accent-ink underline-offset-2">choose a file</u>
            </span>
            <span id={helpId} className="text-xs text-muted">
              JPEG, PNG or WebP, up to 5 MB
            </span>
          </label>
          {message && (
            <p
              id={errorId}
              role={internalError ? 'alert' : undefined}
              className="flex items-start gap-1.5 text-xs text-danger"
            >
              <CircleAlert aria-hidden="true" size={14} strokeWidth={1.75} className="mt-0.5" />
              {message}
            </p>
          )}
        </>
      )}
    </div>
  );
}
