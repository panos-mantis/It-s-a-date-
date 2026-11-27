import { slugify, tagCreateSchema, type TagCreateInput, type TagDTO } from '@itsadate/shared';
import { Check, Pencil, Plus, Tag, Trash2, WifiOff } from 'lucide-react';
import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import {
  BusyStatus,
  Button,
  EmptyState,
  FormError,
  IconPicker,
  Input,
  TagIcon,
  useToast,
} from '../../components/ui';
import { ApiError, NETWORK_MESSAGE } from '../../lib/api';
import { cn } from '../../lib/cn';
import { applyServerErrors, fieldResolver } from '../../lib/form-errors';
import { useTags } from '../tags/api';
import { useCreateTag, useDeleteTag, useUpdateTag } from './api';
import { ConfirmDialog } from './ConfirmDialog';
import {
  actionsTdClass,
  CardLabel,
  ListSkeleton,
  tableClass,
  tableWrap,
  tbodyClass,
  tdClass,
  thClass,
  theadClass,
  trClass,
} from './table';

const NAME_LENGTH = 'Use 2 to 30 characters.';
const DEFAULT_ICON = 'sparkles';
const NAME_INPUT_ID = 'tag-name';

const addResolver = fieldResolver(tagCreateSchema, (issue) =>
  issue.path[0] === 'name' ? NAME_LENGTH : undefined,
);

/** Admin Tags (HANDOFF §1): add with a live slug and an icon picker, rename in place, delete. */
export function TagsTab() {
  const tags = useTags();
  const toast = useToast();
  const remove = useDeleteTag();
  const [deleting, setDeleting] = useState<TagDTO | null>(null);
  // The tag whose Rename button takes focus once a delete has closed its dialog.
  const [focusId, setFocusId] = useState<string | null>(null);

  const sorted = useMemo(
    () => [...(tags.data ?? [])].sort((a, b) => a.name.localeCompare(b.name)),
    [tags.data],
  );

  useEffect(() => {
    if (focusId) {
      document.querySelector<HTMLElement>(`[data-rename="${CSS.escape(focusId)}"]`)?.focus();
    }
  }, [focusId]);

  const confirmDelete = async (tag: TagDTO) => {
    const at = sorted.findIndex((t) => t.id === tag.id);
    const next = sorted[at + 1] ?? sorted[at - 1];
    await remove.mutateAsync(tag.id);
    toast.show('Tag deleted', { tone: 'success' });
    if (next) setFocusId(next.id);
    else document.getElementById(NAME_INPUT_ID)?.focus();
  };

  let list;
  if (tags.isPending) {
    list = (
      <div aria-busy="true">
        <p role="status" className="mb-4 text-sm text-muted">
          Loading tags…
        </p>
        <ListSkeleton />
      </div>
    );
  } else if (tags.isError) {
    list = (
      <div role="alert" className="rounded-lg border border-border bg-surface">
        <EmptyState
          icon={WifiOff}
          title="We couldn't load the tags."
          body="Check your connection and try again."
          action={
            <Button busy={tags.isFetching} onClick={() => void tags.refetch()}>
              Try again
            </Button>
          }
        />
      </div>
    );
  } else if (sorted.length === 0) {
    list = (
      <div className="rounded-lg border border-border bg-surface">
        <EmptyState
          icon={Tag}
          title="No tags yet."
          body="Add the first one. It shows as a button on Home and a chip on every idea that has it."
        />
      </div>
    );
  } else {
    list = (
      <div className={tableWrap}>
        <table className={tableClass} aria-label="Tags, A to Z">
          <thead className={theadClass}>
            <tr>
              <th scope="col" className={thClass}>
                Name
              </th>
              <th scope="col" className={thClass}>
                Slug
              </th>
              <th scope="col" className={thClass}>
                Icon
              </th>
              <th scope="col" className={thClass}>
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className={tbodyClass}>
            {sorted.map((tag) => (
              <TagRow key={tag.id} tag={tag} onDelete={() => setDeleting(tag)} />
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  const name = deleting?.name ?? '';
  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
      <AddTagForm />
      <div className="min-w-0">
        <p className="mb-4 text-sm text-muted">
          <strong className="mr-2 font-semibold text-fg">
            {tags.isSuccess ? `${sorted.length} ${sorted.length === 1 ? 'tag' : 'tags'}` : 'Tags'}
          </strong>
          They show as the category row on Home and as chips on every idea.
        </p>
        {list}
      </div>
      <ConfirmDialog
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        title={`Delete "${name}"?`}
        body={`It comes off every idea that has it, and the ${name} button leaves Home. An idea tagged only ${name} is left with no tag until someone edits it. This can’t be undone.`}
        confirmLabel="Delete tag"
        onConfirm={() => (deleting ? confirmDelete(deleting) : undefined)}
      />
    </div>
  );
}

function AddTagForm() {
  const create = useCreateTag();
  const toast = useToast();
  const titleId = useId();
  const statusId = useId();
  const form = useForm<TagCreateInput>({
    resolver: addResolver,
    defaultValues: { name: '', icon: DEFAULT_ICON },
  });
  const { register, handleSubmit, setError, setFocus, reset, control, formState } = form;
  const name = useWatch({ control, name: 'name' });
  const icon = useWatch({ control, name: 'icon' });
  const busy = formState.isSubmitting;

  const submit = handleSubmit(async (values) => {
    try {
      await create.mutateAsync(values);
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setError('name', { type: 'server', message: err.message });
        setFocus('name');
      } else {
        applyServerErrors(err, setError, ['name', 'icon']);
      }
      return;
    }
    toast.show(`Tag added: ${values.name}`, { tone: 'success' });
    reset();
    document.getElementById(NAME_INPUT_ID)?.focus();
  });

  return (
    <form
      aria-labelledby={titleId}
      noValidate
      onSubmit={(e) => void submit(e)}
      aria-busy={busy || undefined}
      className="group flex flex-col gap-4 rounded-lg border border-border bg-surface p-5 lg:sticky lg:top-20 lg:order-2"
    >
      <h2 id={titleId} className="font-body text-base font-semibold leading-body text-fg">
        Add a tag
      </h2>
      <Input
        {...register('name')}
        id={NAME_INPUT_ID}
        label="Name"
        placeholder="Picnics"
        autoComplete="off"
        maxLength={30}
        hint={
          <>
            2–30 characters. Slug: <code>{slugify(name) || 'picnics'}</code>
          </>
        }
        error={formState.errors.name?.message}
      />
      <IconPicker
        name="add-tag-icon"
        value={icon}
        onChange={(next) => form.setValue('icon', next, { shouldDirty: true })}
      />
      <FormError message={formState.errors.root?.server?.message} />
      <Button
        type="submit"
        size="sm"
        busy={busy}
        aria-describedby={statusId}
        className="self-start"
      >
        <Plus aria-hidden="true" size={16} strokeWidth={1.75} />
        Add tag
      </Button>
      <BusyStatus id={statusId} busy={busy} text="Adding the tag…" />
    </form>
  );
}

function TagRow({ tag, onDelete }: { tag: TagDTO; onDelete: () => void }) {
  const [editing, setEditing] = useState(false);
  const [refocus, setRefocus] = useState(0);
  const renameRef = useRef<HTMLButtonElement>(null);
  const nameId = useId();

  // Back from the rename row: focus is on the Rename button again.
  useEffect(() => {
    if (refocus > 0) renameRef.current?.focus();
  }, [refocus]);

  const done = () => {
    setEditing(false);
    setRefocus((n) => n + 1);
  };

  if (editing) return <RenameRow tag={tag} onDone={done} />;

  return (
    <tr
      className={cn(
        trClass,
        '@max-[719px]:flex-wrap @max-[719px]:items-center @max-[719px]:gap-x-3 @max-[719px]:gap-y-2',
      )}
    >
      <td className={cn(tdClass, '@max-[719px]:basis-full')}>
        <span className="flex items-center gap-3">
          <span
            aria-hidden="true"
            className="grid size-9 shrink-0 place-items-center rounded-pill bg-accent-soft text-accent-ink"
          >
            <TagIcon name={tag.icon} />
          </span>
          <span id={nameId} className="font-medium text-fg [overflow-wrap:anywhere]">
            {tag.name}
          </span>
        </span>
      </td>
      <td className={cn(tdClass, 'text-muted')}>
        <CardLabel>Slug</CardLabel>
        <code className="rounded-sm bg-bg px-1.5 py-0.5 text-fg">{tag.slug}</code>
      </td>
      <td className={cn(tdClass, 'text-muted')}>
        <CardLabel>Icon</CardLabel>
        <code className="rounded-sm bg-bg px-1.5 py-0.5 text-fg">{tag.icon}</code>
      </td>
      <td
        className={cn(
          actionsTdClass,
          '@max-[719px]:basis-full @max-[719px]:border-t @max-[719px]:border-border @max-[719px]:pt-2',
        )}
      >
        <div className="flex justify-end gap-1 @max-[719px]:[&>button]:flex-1">
          <Button
            ref={renameRef}
            variant="ghost"
            tone="plain"
            size="sm"
            data-rename={tag.id}
            aria-describedby={nameId}
            onClick={() => setEditing(true)}
          >
            <Pencil aria-hidden="true" size={16} strokeWidth={1.75} />
            Rename
          </Button>
          <Button
            variant="ghost"
            tone="danger"
            size="sm"
            aria-haspopup="dialog"
            aria-describedby={nameId}
            onClick={onDelete}
          >
            <Trash2 aria-hidden="true" size={16} strokeWidth={1.75} />
            Delete
          </Button>
        </div>
      </td>
    </tr>
  );
}

/** The row while it is being renamed: name and icon. Save, Enter, Cancel and Escape. */
function RenameRow({ tag, onDone }: { tag: TagDTO; onDone: () => void }) {
  const update = useUpdateTag();
  const toast = useToast();
  const [name, setName] = useState(tag.name);
  const [icon, setIcon] = useState(tag.icon);
  const [error, setError] = useState<string>();
  const [rootError, setRootError] = useState<string>();
  const inputRef = useRef<HTMLInputElement>(null);
  const busy = update.isPending;

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  const save = async () => {
    if (busy) return;
    setRootError(undefined);
    const parsed = tagCreateSchema.safeParse({ name, icon });
    if (!parsed.success) {
      setError(NAME_LENGTH);
      inputRef.current?.focus();
      return;
    }
    try {
      await update.mutateAsync({ id: tag.id, input: parsed.data });
    } catch (err) {
      if (err instanceof ApiError && (err.status === 409 || err.status === 422)) {
        setError(err.issues.find((i) => i.path === 'name')?.message ?? err.message);
        inputRef.current?.focus();
      } else {
        setRootError(err instanceof ApiError ? err.message : NETWORK_MESSAGE);
      }
      return;
    }
    toast.show(`Tag renamed to ${parsed.data.name}`, { tone: 'success' });
    onDone();
  };

  return (
    <tr className={cn(trClass, '@max-[719px]:flex-wrap @max-[719px]:gap-y-3')}>
      <td colSpan={3} className={cn(tdClass, '@max-[719px]:basis-full')}>
        {/* Keys bubble up from the name and the icon radios; the form has no button of its own. */}
        {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */}
        <form
          noValidate
          aria-label={`Rename ${tag.name}`}
          onSubmit={(e) => {
            e.preventDefault();
            void save();
          }}
          onKeyDown={(e) => {
            // One Escape closes only this row.
            if (e.key === 'Escape') {
              e.preventDefault();
              e.stopPropagation();
              onDone();
            }
            // Enter saves from the name or from a picked icon alike.
            if (e.key === 'Enter' && e.target instanceof HTMLInputElement) {
              e.preventDefault();
              void save();
            }
          }}
          className="flex max-w-[520px] flex-col gap-4 py-1"
        >
          <Input
            ref={inputRef}
            label="New name"
            autoComplete="off"
            maxLength={30}
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setError(undefined);
            }}
            error={error}
          />
          <IconPicker name={`rename-icon-${tag.id}`} value={icon} onChange={setIcon} />
          <FormError message={rootError} />
        </form>
      </td>
      <td className={cn(actionsTdClass, '@max-[719px]:basis-full')}>
        <div className="flex justify-end gap-1 @max-[719px]:[&>button]:flex-1">
          <Button variant="ghost" tone="success" size="sm" busy={busy} onClick={() => void save()}>
            <Check aria-hidden="true" size={16} strokeWidth={1.75} />
            Save
          </Button>
          <Button variant="ghost" tone="plain" size="sm" onClick={onDone}>
            Cancel
          </Button>
        </div>
      </td>
    </tr>
  );
}
