import { useId, useRef, useState, type RefObject } from 'react';
import { Button, Dialog, FormError } from '../../components/ui';
import { ApiError, NETWORK_MESSAGE } from '../../lib/api';

interface ConfirmProps {
  open: boolean;
  onClose: () => void;
  title: string;
  body: string;
  confirmLabel: string;
  /** Does the work. While it runs the confirm button is busy; a failure shows inside the dialog. */
  onConfirm: () => Promise<unknown> | void;
}

/**
 * Asks before a destructive action (HANDOFF §2 "Confirm dialog"): an alertdialog described by its
 * body that starts on Cancel. Success closes it; the confirm button is the danger fill.
 */
export function ConfirmDialog(props: ConfirmProps) {
  const titleId = useId();
  const bodyId = useId();
  const cancelRef = useRef<HTMLButtonElement>(null);
  return (
    <Dialog
      open={props.open}
      onClose={props.onClose}
      labelledBy={titleId}
      describedBy={bodyId}
      variant="alert"
      initialFocus={cancelRef}
    >
      {/* Mounted only while open, so every opening starts without a busy state or an old error. */}
      <ConfirmBody {...props} titleId={titleId} bodyId={bodyId} cancelRef={cancelRef} />
    </Dialog>
  );
}

function ConfirmBody({
  onClose,
  title,
  body,
  confirmLabel,
  onConfirm,
  titleId,
  bodyId,
  cancelRef,
}: ConfirmProps & {
  titleId: string;
  bodyId: string;
  cancelRef: RefObject<HTMLButtonElement | null>;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();

  const confirm = async () => {
    setBusy(true);
    setError(undefined);
    try {
      await onConfirm();
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : NETWORK_MESSAGE);
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <h2
        id={titleId}
        className="text-xl font-medium leading-[1.2] tracking-[-0.01em] text-fg [overflow-wrap:anywhere]"
      >
        {title}
      </h2>
      <p id={bodyId} className="text-muted">
        {body}
      </p>
      <FormError message={error} />
      <div className="mt-2 flex flex-wrap justify-end gap-3">
        <Button ref={cancelRef} variant="secondary" size="sm" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="danger" size="sm" busy={busy} onClick={() => void confirm()}>
          {confirmLabel}
        </Button>
      </div>
    </div>
  );
}
