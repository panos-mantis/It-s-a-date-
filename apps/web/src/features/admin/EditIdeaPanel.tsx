import {
  ideaUpdateSchema,
  PLACE_TYPES,
  type IdeaDTO,
  type IdeaStatus,
  type IdeaUpdateInput,
} from '@itsadate/shared';
import { Trash2, TriangleAlert, X } from 'lucide-react';
import { useId, useRef, useState, type RefObject } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import type { z } from 'zod';
import {
  BusyStatus,
  Button,
  Dialog,
  FormError,
  Input,
  PhotoDropZone,
  SegmentedControl,
  Select,
  Textarea,
} from '../../components/ui';
import { applyServerErrors, fieldResolver } from '../../lib/form-errors';
import { PLACE_TYPE_LABELS } from '../../lib/labels';
import { useUploadImage } from '../ideas/api';
import { ideaFieldMessage } from '../ideas/share-errors';
import { BUDGET_OPTIONS, DURATION_OPTIONS, TagPicker } from '../ideas/SharePage';
import { useDeleteIdea, useUpdateIdea } from './api';
import { ConfirmDialog } from './ConfirmDialog';
import { relativeSubmitted } from './relative-date';

type Values = z.input<typeof ideaUpdateSchema>;
type Parsed = z.output<typeof ideaUpdateSchema>;

const STATUS_OPTIONS: { value: IdeaStatus; label: string }[] = [
  { value: 'pending', label: 'Pending review' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Not approved' },
];
// "Not set" stands for null. The API can't clear a budget or duration (R32), so it is only
// pickable while the idea has none.
const NOT_SET = { value: '', label: 'Not set' };
const EDIT_BUDGETS = [NOT_SET, ...BUDGET_OPTIONS];
const EDIT_DURATIONS = [NOT_SET, ...DURATION_OPTIONS];

const FIELDS = [
  'status',
  'image',
  'title',
  'description',
  'tagIds',
  'placeType',
  'budget',
  'duration',
] as const;

const editResolver = fieldResolver(ideaUpdateSchema, (issue) =>
  issue.path[0] === 'status' ? 'Pick a status.' : ideaFieldMessage(issue),
);

function defaultsOf(idea: IdeaDTO): Values {
  return {
    status: idea.status,
    title: idea.title,
    description: idea.description,
    image: idea.image ?? undefined,
    tagIds: idea.tags.map((t) => t.id),
    placeType: idea.placeType,
    budget: idea.budget ?? undefined,
    duration: idea.duration ?? undefined,
  };
}

function sameSet(a: readonly string[], b: readonly string[]): boolean {
  const set = new Set(a);
  return set.size === new Set(b).size && b.every((x) => set.has(x));
}

/** Only what the admin changed (H1). Tags compare as sets; the photo only if a new one was sent. */
function changesOf(idea: IdeaDTO, v: Parsed): IdeaUpdateInput {
  const out: IdeaUpdateInput = {};
  if (v.status !== undefined && v.status !== idea.status) out.status = v.status;
  if (v.title !== undefined && v.title !== idea.title) out.title = v.title;
  if (v.description !== undefined && v.description !== idea.description) {
    out.description = v.description;
  }
  if (v.placeType !== undefined && v.placeType !== idea.placeType) out.placeType = v.placeType;
  if (v.budget !== undefined && v.budget !== idea.budget) out.budget = v.budget;
  if (v.duration !== undefined && v.duration !== idea.duration) out.duration = v.duration;
  if (
    v.tagIds !== undefined &&
    !sameSet(
      v.tagIds,
      idea.tags.map((t) => t.id),
    )
  ) {
    out.tagIds = v.tagIds;
  }
  if (v.image && (v.image.publicId !== idea.image?.publicId || v.image.url !== idea.image.url)) {
    out.image = v.image;
  }
  return out;
}

/** "Submitted today", "Submitted 3 days ago", "Submitted on Mar 9, 2024" ("Shared" once reviewed). */
function whenLine(idea: IdeaDTO, now: Date): string {
  const verb = idea.status === 'pending' ? 'Submitted' : 'Shared';
  const when = relativeSubmitted(idea.createdAt, now);
  return /^(today|\d+ days? ago)$/.test(when) ? `${verb} ${when}` : `${verb} on ${when}`;
}

/**
 * Edit an idea (HANDOFF §2 "Side panel / sheet"): a 560px panel, full screen on phones, with
 * every Share field plus Status, and a danger zone that deletes the idea after asking.
 */
export function EditIdeaPanel({
  idea,
  onClose,
  onSaved,
  onDeleted,
}: {
  idea: IdeaDTO | null;
  onClose: () => void;
  onSaved: (before: IdeaDTO, saved: IdeaDTO) => void;
  onDeleted: (idea: IdeaDTO) => void;
}) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const titleId = useId();
  const subId = useId();
  return (
    <Dialog
      open={idea !== null}
      onClose={onClose}
      labelledBy={titleId}
      describedBy={subId}
      variant="panel"
      initialFocus={headingRef}
    >
      {idea && (
        <EditForm
          key={idea.id}
          idea={idea}
          onClose={onClose}
          onSaved={onSaved}
          onDeleted={onDeleted}
          headingRef={headingRef}
          titleId={titleId}
          subId={subId}
        />
      )}
    </Dialog>
  );
}

function EditForm({
  idea,
  onClose,
  onSaved,
  onDeleted,
  headingRef,
  titleId,
  subId,
}: {
  idea: IdeaDTO;
  onClose: () => void;
  onSaved: (before: IdeaDTO, saved: IdeaDTO) => void;
  onDeleted: (idea: IdeaDTO) => void;
  headingRef: RefObject<HTMLHeadingElement | null>;
  titleId: string;
  subId: string;
}) {
  const update = useUpdateIdea();
  const remove = useDeleteIdea();
  const upload = useUploadImage();
  const formId = useId();
  const statusId = useId();
  const [now] = useState(() => new Date());
  const [uploading, setUploading] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<Values, unknown, Parsed>({
    resolver: editResolver,
    defaultValues: defaultsOf(idea),
    mode: 'onBlur',
  });

  const busy = isSubmitting || update.isPending;
  const titleLength = (useWatch({ control, name: 'title' }) ?? '').length;
  const descriptionLength = (useWatch({ control, name: 'description' }) ?? '').length;
  const migrated = idea.budget === null || idea.duration === null;

  const onSubmit = async (values: Parsed) => {
    const input = changesOf(idea, values);
    if (Object.keys(input).length === 0) {
      onClose();
      return;
    }
    try {
      onSaved(idea, await update.mutateAsync({ id: idea.id, input }));
    } catch (err) {
      // Shown here in the panel, not as a toast.
      applyServerErrors(err, setError, FIELDS);
    }
  };

  const tagError = errors.tagIds?.message ?? errors.tagIds?.root?.message;

  return (
    <>
      <div className="flex shrink-0 items-start justify-between gap-3 border-b border-border bg-surface py-3 pl-4 pr-2 sm:py-4 sm:pl-6 sm:pr-4">
        <div className="min-w-0">
          <h2
            id={titleId}
            ref={headingRef}
            tabIndex={-1}
            className="text-xl font-medium leading-[1.2] tracking-[-0.01em] text-fg outline-none"
          >
            Edit idea
          </h2>
          <p id={subId} className="text-sm text-muted [overflow-wrap:anywhere]">
            By {idea.creator.name} · {whenLine(idea, now)}
          </p>
        </div>
        <button
          type="button"
          aria-label="Close"
          onClick={onClose}
          className="grid size-11 shrink-0 cursor-pointer place-items-center rounded-pill hover:bg-surface-sunk"
        >
          <X aria-hidden="true" size={20} strokeWidth={1.75} />
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-bg px-4 py-5 sm:p-6">
        <form
          id={formId}
          onSubmit={(e) => void handleSubmit(onSubmit)(e)}
          noValidate
          aria-busy={busy}
          className="group flex flex-col gap-7"
        >
          <FormError message={errors.root?.server?.message ?? errors.root?.form?.message} />

          <Controller
            control={control}
            name="status"
            render={({ field, fieldState }) => (
              <SegmentedControl
                legend="Status"
                name="edit-status"
                options={STATUS_OPTIONS}
                columns={2}
                value={field.value ?? null}
                onChange={field.onChange}
                disabled={busy}
                error={fieldState.error?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="image"
            render={({ field, fieldState }) => (
              <PhotoDropZone
                value={field.value ?? null}
                // No photo means "keep what the idea has": the API can't clear one.
                onChange={(next) => field.onChange(next ?? undefined)}
                upload={upload.mutateAsync}
                onUploadingChange={setUploading}
                removable={false}
                error={fieldState.error?.message}
              />
            )}
          />

          <Input
            label="Title"
            maxLength={80}
            hint="3–80 characters"
            counter={`${titleLength}/80`}
            counterFull={titleLength >= 80}
            readOnly={busy}
            error={errors.title?.message}
            {...register('title')}
          />

          <Textarea
            label="Description"
            maxLength={2000}
            rows={6}
            hint="20–2000 characters"
            counter={`${descriptionLength}/2000`}
            counterFull={descriptionLength >= 2000}
            readOnly={busy}
            error={errors.description?.message}
            {...register('description')}
          />

          <Controller
            control={control}
            name="tagIds"
            render={({ field }) => (
              <TagPicker
                value={field.value ?? []}
                onChange={field.onChange}
                error={tagError}
                limitHint="That’s 3. Unpick one to choose another."
              />
            )}
          />

          <div className="flex flex-col gap-6">
            <Select
              label="Place type"
              hint={
                'Used to find places near whoever reads the idea. "No place needed" hides that button.'
              }
              error={errors.placeType?.message}
              {...register('placeType')}
            >
              {PLACE_TYPES.map((p) => (
                <option key={p} value={p}>
                  {PLACE_TYPE_LABELS[p]}
                </option>
              ))}
            </Select>

            <Controller
              control={control}
              name="budget"
              render={({ field, fieldState }) => (
                <SegmentedControl
                  legend="Budget"
                  name="edit-budget"
                  options={EDIT_BUDGETS}
                  columns={2}
                  value={field.value === undefined ? '' : String(field.value)}
                  onChange={(v) => field.onChange(v === '' ? undefined : v)}
                  disabledValues={idea.budget === null ? [] : ['']}
                  disabled={busy}
                  error={fieldState.error?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="duration"
              render={({ field, fieldState }) => (
                <SegmentedControl
                  legend="Duration"
                  name="edit-duration"
                  options={EDIT_DURATIONS}
                  columns={2}
                  value={field.value ?? ''}
                  onChange={(v) => field.onChange(v === '' ? undefined : v)}
                  disabledValues={idea.duration === null ? [] : ['']}
                  disabled={busy}
                  error={fieldState.error?.message}
                />
              )}
            />

            {migrated && (
              <p className="flex items-start gap-2 text-sm text-muted">
                <TriangleAlert
                  aria-hidden="true"
                  size={16}
                  strokeWidth={1.75}
                  className="mt-0.5 shrink-0 text-warn"
                />
                <span>
                  Migrated ideas start without a budget or duration. Once you set one, &quot;Not
                  set&quot; can&apos;t be picked again.
                </span>
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-t border-border pt-5">
            <p className="max-w-[34ch] text-sm text-muted">
              Deleting removes the idea with its ratings and saves.
            </p>
            <Button
              variant="ghost"
              tone="danger"
              size="sm"
              aria-haspopup="dialog"
              onClick={() => setConfirming(true)}
            >
              <Trash2 aria-hidden="true" size={16} strokeWidth={1.75} />
              Delete idea
            </Button>
          </div>
        </form>
      </div>

      <div className="flex shrink-0 items-center justify-end gap-3 border-t border-border bg-surface px-4 py-3 sm:px-6 sm:py-4">
        <BusyStatus
          id={statusId}
          busy={busy}
          text="Saving your changes…"
          className="mr-auto text-sm text-muted max-sm:sr-only"
        />
        <Button variant="secondary" size="sm" onClick={onClose} className="max-sm:flex-1">
          Cancel
        </Button>
        <Button
          type="submit"
          form={formId}
          size="sm"
          busy={busy}
          disabled={uploading}
          className="max-sm:flex-1"
        >
          Save changes
        </Button>
      </div>

      <ConfirmDialog
        open={confirming}
        onClose={() => setConfirming(false)}
        title={`Delete "${idea.title}"?`}
        body="It comes off Home along with its ratings and saves, and the author loses it from their profile. This can’t be undone."
        confirmLabel="Delete idea"
        onConfirm={async () => {
          await remove.mutateAsync(idea.id);
          onDeleted(idea);
        }}
      />
    </>
  );
}
