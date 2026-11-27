import {
  DURATION_LABELS,
  DURATIONS,
  ideaCreateSchema,
  PLACE_TYPES,
  type IdeaDTO,
} from '@itsadate/shared';
import { Clock, Shield } from 'lucide-react';
import { useId, useRef, useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import type { z } from 'zod';
import {
  Button,
  Input,
  PhotoDropZone,
  SegmentedControl,
  SelectableChip,
  Select,
  Skeleton,
  Textarea,
  BusyStatus,
  FormError,
} from '../../components/ui';
import { applyServerErrors } from '../../lib/form-errors';
import { PLACE_TYPE_LABELS } from '../../lib/labels';
import { tagIcon } from '../../lib/tag-icons';
import { useTags } from '../tags/api';
import { useCreateIdea, useUploadImage } from './api';
import { SHARE_FIELDS, shareResolver, type ShareFieldName } from './share-errors';
import { ShareSuccess } from './ShareSuccess';

type Values = z.input<typeof ideaCreateSchema>;
type Parsed = z.output<typeof ideaCreateSchema>;

const BUDGET_OPTIONS = [
  { value: '1', label: '$', ariaLabel: '$, low budget' },
  { value: '2', label: '$$', ariaLabel: '$$, medium budget' },
  { value: '3', label: '$$$', ariaLabel: '$$$, high budget' },
];
const DURATION_OPTIONS = DURATIONS.map((d) => ({
  value: d,
  label: DURATION_LABELS[d],
}));
const MAX_TAGS = 3;
const FIELD_NAMES = SHARE_FIELDS.map((f) => f.name);

// Nothing is picked until the user picks it; the schema reports what is missing.
const EMPTY = {
  title: '',
  description: '',
  image: undefined,
  tagIds: [],
  placeType: '',
  budget: undefined,
  duration: undefined,
} as unknown as Values;

export function SharePage() {
  const tags = useTags();
  const create = useCreateIdea();
  const upload = useUploadImage();
  const formRef = useRef<HTMLFormElement>(null);
  const headRef = useRef<HTMLHeadingElement>(null);
  const [uploading, setUploading] = useState(false);
  const [created, setCreated] = useState<IdeaDTO | null>(null);
  const [round, setRound] = useState(0);
  const statusId = useId();
  const waitId = useId();
  const noteId = useId();
  const tagHintId = useId();

  const {
    register,
    control,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting, submitCount },
  } = useForm<Values, unknown, Parsed>({
    resolver: shareResolver,
    defaultValues: EMPTY,
    mode: 'onBlur',
  });

  const busy = isSubmitting || create.isPending;
  const picked = useWatch({ control, name: 'tagIds' }) ?? [];
  const titleLength = (useWatch({ control, name: 'title' }) ?? '').length;
  const descriptionLength = (useWatch({ control, name: 'description' }) ?? '').length;

  const onSubmit = async (values: Parsed) => {
    try {
      setCreated(await create.mutateAsync(values));
    } catch (err) {
      applyServerErrors(err, setError, FIELD_NAMES);
    }
  };

  const another = () => {
    reset(EMPTY);
    create.reset();
    setUploading(false);
    setRound((n) => n + 1);
    setCreated(null);
    // The success view is gone; put focus back at the top of the form.
    requestAnimationFrame(() => headRef.current?.focus());
  };

  if (created) {
    return (
      <>
        <title>Idea sent · It&apos;s a Date</title>
        <ShareSuccess idea={created} onAnother={another} />
      </>
    );
  }

  const failed = SHARE_FIELDS.filter((f) => errors[f.name]);
  const jump = (name: ShareFieldName) => {
    formRef.current
      ?.querySelector<HTMLElement>(
        `[data-field="${name}"] :is(input:not([type="file"]), textarea, select, button), [data-field="${name}"] input[type="file"]`,
      )
      ?.focus();
  };

  const atLimit = picked.length >= MAX_TAGS;
  const tagError = errors.tagIds?.message ?? errors.tagIds?.root?.message;

  return (
    <div className="mx-auto max-w-[640px] pb-16 pt-2">
      <title>Share an idea · It&apos;s a Date</title>
      <div className="mb-6 flex flex-col gap-2 sm:mb-8">
        <h1
          ref={headRef}
          tabIndex={-1}
          className="text-[30px] leading-[1.08] tracking-display text-fg outline-none sm:text-[38px] [&_em]:font-normal [&_em]:italic"
        >
          Share <em>an idea</em>
        </h1>
        <p className="max-w-[52ch] text-muted">
          Tell people about a date you&apos;d happily go on again. A good photo, a few lines on what
          to do, and roughly what it costs.
        </p>
      </div>

      <form
        key={round}
        ref={formRef}
        onSubmit={(e) => void handleSubmit(onSubmit)(e)}
        noValidate
        aria-busy={busy}
        className="group flex flex-col gap-8"
      >
        {submitCount > 0 && failed.length > 0 ? (
          <div
            role="alert"
            className="flex items-start gap-2.5 rounded-sm border border-danger bg-surface px-3.5 py-3 text-sm font-semibold text-danger"
          >
            <div>
              {failed.length === 1
                ? 'Check the 1 field marked below.'
                : `Check the ${failed.length} fields marked below.`}
              <ul className="mt-1 list-disc pl-[18px] font-normal">
                {failed.map((f) => (
                  <li key={f.name}>
                    <a
                      href={`#${f.name}`}
                      className="inline-flex min-h-11 items-center underline underline-offset-2"
                      onClick={(e) => {
                        e.preventDefault();
                        jump(f.name);
                      }}
                    >
                      {f.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ) : (
          <FormError message={errors.root?.server?.message} />
        )}

        <div data-field="image" className="scroll-mt-24">
          <Controller
            control={control}
            name="image"
            render={({ field, fieldState }) => (
              <PhotoDropZone
                value={field.value ?? null}
                onChange={(next) => field.onChange(next ?? undefined)}
                upload={upload.mutateAsync}
                onUploadingChange={setUploading}
                error={fieldState.error?.message}
              />
            )}
          />
        </div>

        <div data-field="title" className="scroll-mt-24">
          <Input
            label="Title"
            maxLength={80}
            placeholder="Pottery for two"
            hint="Short and concrete works best."
            counter={`${titleLength}/80`}
            counterFull={titleLength >= 80}
            readOnly={busy}
            error={errors.title?.message}
            {...register('title')}
          />
        </div>

        <div data-field="description" className="scroll-mt-24">
          <Textarea
            label="Description"
            maxLength={2000}
            rows={5}
            placeholder="What do you do, and what makes it fun?"
            hint="At least 20 characters"
            counter={`${descriptionLength}/2000`}
            counterFull={descriptionLength >= 2000}
            readOnly={busy}
            error={errors.description?.message}
            {...register('description')}
          />
        </div>

        <fieldset
          data-field="tagIds"
          aria-describedby={tagHintId}
          className="flex min-w-0 scroll-mt-24 flex-col gap-1.5"
        >
          <legend className="text-sm font-semibold text-fg">Tags</legend>
          <p id={tagHintId} className={tagError ? 'text-xs text-danger' : 'text-xs text-muted'}>
            {tagError ??
              (atLimit ? "You've picked 3. Remove one to pick another." : 'Pick up to 3')}
          </p>
          {tags.isPending ? (
            <div role="status" aria-label="Loading tags" className="flex flex-wrap gap-2">
              {Array.from({ length: 5 }, (_, i) => (
                <Skeleton key={i} className="h-11 w-24 rounded-pill" />
              ))}
            </div>
          ) : tags.isError ? (
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <p>We couldn&apos;t load the tags.</p>
              <Button variant="secondary" size="sm" onClick={() => void tags.refetch()}>
                Try again
              </Button>
            </div>
          ) : tags.data.length === 0 ? (
            <p className="text-sm text-muted">There are no tags yet. Check back soon.</p>
          ) : (
            <Controller
              control={control}
              name="tagIds"
              render={({ field }) => {
                const ids = field.value;
                return (
                  <div className="mt-1 flex flex-wrap gap-2">
                    {tags.data.map((t) => {
                      const on = ids.includes(t.id);
                      return (
                        <SelectableChip
                          key={t.id}
                          selected={on}
                          disabled={!on && atLimit}
                          icon={tagIcon(t.icon)}
                          onToggle={() => {
                            field.onChange(on ? ids.filter((i) => i !== t.id) : [...ids, t.id]);
                          }}
                        >
                          {t.name}
                        </SelectableChip>
                      );
                    })}
                  </div>
                );
              }}
            />
          )}
        </fieldset>

        <div data-field="placeType" className="scroll-mt-24 group-aria-busy:pointer-events-none">
          <Select
            label="Place type"
            hint={
              'We use it to find places near whoever reads your idea. Pick "No place needed" for dates at home.'
            }
            error={errors.placeType?.message}
            {...register('placeType')}
          >
            <option value="" disabled>
              Choose a place type
            </option>
            {PLACE_TYPES.map((p) => (
              <option key={p} value={p}>
                {PLACE_TYPE_LABELS[p]}
              </option>
            ))}
          </Select>
        </div>

        <div data-field="budget" className="flex flex-col gap-1 scroll-mt-24">
          <Controller
            control={control}
            name="budget"
            render={({ field, fieldState }) => (
              <SegmentedControl
                legend="Budget"
                name="budget"
                options={BUDGET_OPTIONS}
                value={field.value === undefined ? null : String(field.value)}
                onChange={field.onChange}
                disabled={busy}
                error={fieldState.error?.message}
              />
            )}
          />
          <p
            aria-hidden="true"
            className="flex max-w-[420px] justify-between px-4 text-xs text-muted"
          >
            <span>Low</span>
            <span>High</span>
          </p>
        </div>

        <div data-field="duration" className="scroll-mt-24">
          <Controller
            control={control}
            name="duration"
            render={({ field, fieldState }) => (
              <SegmentedControl
                legend="Duration"
                name="duration"
                options={DURATION_OPTIONS}
                value={field.value ?? null}
                onChange={field.onChange}
                disabled={busy}
                error={fieldState.error?.message}
              />
            )}
          />
        </div>

        <div className="flex flex-col items-start gap-3 border-t border-border pt-2">
          <div className="flex w-full flex-col gap-3 pt-4 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-4">
            <Button
              type="submit"
              busy={busy}
              disabled={uploading}
              aria-describedby={uploading ? waitId : noteId}
              className="w-full sm:min-w-[200px] sm:w-auto"
            >
              {busy ? 'Sending…' : 'Send for review'}
            </Button>
            {uploading ? (
              <p id={waitId} className="flex items-center gap-2 text-sm text-muted">
                <Clock aria-hidden="true" size={16} strokeWidth={1.75} />
                You can send it once the photo has uploaded.
              </p>
            ) : (
              <p id={noteId} className="flex items-center gap-2 text-sm text-muted">
                <Shield aria-hidden="true" size={16} strokeWidth={1.75} />
                An admin checks every idea before it goes live.
              </p>
            )}
          </div>
          <BusyStatus id={statusId} busy={busy} text="Sending your idea for review…" />
        </div>
      </form>
    </div>
  );
}
