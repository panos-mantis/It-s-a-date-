import {
  adminIdeaQuerySchema,
  idParamsSchema,
  ideaCreateSchema,
  ideaQuerySchema,
  ideaUpdateSchema,
  type IdeaDTO,
  type TagDTO,
  type UserDTO,
  type ValidationIssue,
} from '@itsadate/shared';
import { http, HttpResponse, type RequestHandler } from 'msw';
import { ideaFixtures } from '../fixtures/ideas';
import { tagFixtures } from '../fixtures/tags';
import { mayaId, userFixtures } from '../fixtures/users';
import { authStore } from './auth-store';

let ideas: IdeaDTO[] = ideaFixtures.map((i) => ({ ...i }));
let tags: TagDTO[] = [...tagFixtures];
let users: UserDTO[] = [...userFixtures];
let uploadMode: 'ok' | 'reject' | 'network' = 'ok';
let uploadDelayMs = 0;
let uploadCount = 0;
let createdCount = 0;

export const ideaStore = {
  reset(): void {
    ideas = ideaFixtures.map((i) => ({ ...i }));
    createdCount = 0;
  },
  all: (): IdeaDTO[] => ideas,
  set(next: IdeaDTO[]): void {
    ideas = next;
  },
  add(idea: IdeaDTO): void {
    ideas = [idea, ...ideas];
  },
  find: (id: string): IdeaDTO | undefined => ideas.find((i) => i.id === id),
};

export const tagStore = {
  reset(): void {
    tags = [...tagFixtures];
  },
  all: (): TagDTO[] => tags,
  set(next: TagDTO[]): void {
    tags = next;
  },
};

/** The fixture-backed people who can appear as creators. */
export const userStore = {
  reset(): void {
    users = [...userFixtures];
  },
  all: (): UserDTO[] => users,
  set(next: UserDTO[]): void {
    users = next;
  },
};

export const uploadStore = {
  reset(): void {
    uploadMode = 'ok';
    uploadDelayMs = 0;
    uploadCount = 0;
  },
  /** `ok` stores the file, `reject` answers 422, `network` drops the connection. */
  mode(next: 'ok' | 'reject' | 'network'): void {
    uploadMode = next;
  },
  /** Holds the response back so tests can look at the uploading state. */
  delay(ms: number): void {
    uploadDelayMs = ms;
  },
};

export function resetIdeasStores(): void {
  ideaStore.reset();
  tagStore.reset();
  userStore.reset();
  uploadStore.reset();
}

function errorResponse(status: number, code: string, message: string, details?: unknown) {
  return HttpResponse.json({ error: { code, message, details } }, { status });
}

function validationResponse(issues: ValidationIssue[]) {
  return errorResponse(422, 'VALIDATION', 'Check the highlighted fields', { issues });
}

function paramsInvalid(issues: { path: PropertyKey[]; message: string }[]) {
  return validationResponse(
    issues.map((i) => ({
      location: 'params',
      path: i.path.map(String).join('.'),
      message: i.message,
    })),
  );
}

// Mirrors apps/api/src/lib/images.ts isOwnImage, with the cloud and folder the tests use.
const CLOUD = 'demo';
const FOLDER = 'itsadate/dev';

function isOwnImage(image: { url: string; publicId: string }): boolean {
  const { publicId } = image;
  if (!/^[A-Za-z0-9_/-]+$/.test(publicId) || publicId.split('/').includes('..')) return false;
  if (!publicId.startsWith(`${FOLDER}/`)) return false;
  let url: URL;
  try {
    url = new URL(image.url);
  } catch {
    return false;
  }
  if (url.protocol !== 'https:' || url.host !== 'res.cloudinary.com') return false;
  if (url.username || url.password) return false;
  const prefix = `/${CLOUD}/image/upload/`;
  if (!url.pathname.startsWith(prefix)) return false;
  const rest = url.pathname.slice(prefix.length).replace(/^v\d+\//, '');
  return ['jpg', 'jpeg', 'png', 'webp'].some((ext) => rest === `${publicId}.${ext}`);
}

/** An image the upload handler would have issued, for tests that post an idea directly. */
export function uploadedImage(n = 1): { url: string; publicId: string } {
  return {
    url: `https://res.cloudinary.com/${CLOUD}/image/upload/v1/${FOLDER}/test-${n}.jpg`,
    publicId: `${FOLDER}/test-${n}`,
  };
}

function unauthorised() {
  return errorResponse(401, 'UNAUTHORIZED', 'Please log in');
}

/** The session user as an idea creator. Fixture people share their id with authStore. */
function sessionCreator(): { id: string; name: string } | null {
  const user = authStore.sessionUser();
  return user ? { id: user.id, name: user.name } : null;
}

/** Mirrors requireAuth + requireRole('admin'): 401 logged out, 403 for everyone but admins. */
function adminGate() {
  const user = authStore.sessionUser();
  if (!user) return unauthorised();
  if (user.role !== 'admin')
    return errorResponse(403, 'FORBIDDEN', "You don't have access to this");
  return null;
}

type Issue = { path: PropertyKey[]; message: string };
const toIssues = (location: ValidationIssue['location'], issues: Issue[]): ValidationIssue[] =>
  issues.map((i) => ({ location, path: i.path.map(String).join('.'), message: i.message }));

// Mirrors apps/api/src/lib/regex.ts: user text matches literally.
const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Fixtures carry Maya's saves and ratings; everyone else sees them blank.
function forViewer(idea: IdeaDTO): IdeaDTO {
  const me = sessionCreator();
  return me?.id === mayaId ? idea : { ...idea, myRating: null, saved: false };
}

export const ideasHandlers: RequestHandler[] = [
  http.get('*/api/v1/tags', () => HttpResponse.json(tags)),

  http.get('*/api/v1/ideas', ({ request }) => {
    const parsed = ideaQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
    if (!parsed.success) {
      return validationResponse(
        parsed.error.issues.map((i) => ({
          location: 'query',
          path: i.path.map(String).join('.'),
          message: i.message,
        })),
      );
    }
    const { q, tag, budget, duration, sort, page, pageSize } = parsed.data;
    const needle = q?.toLowerCase();
    const matches = ideas
      .filter((i) => i.status === 'approved')
      .filter((i) => !needle || `${i.title} ${i.description}`.toLowerCase().includes(needle))
      .filter((i) => !tag || i.tags.some((t) => t.slug === tag))
      .filter((i) => budget === undefined || i.budget === budget)
      .filter((i) => !duration || i.duration === duration);
    const sorted = [...matches].sort((a, b) =>
      sort === 'top'
        ? b.ratingAvg - a.ratingAvg || b.ratingCount - a.ratingCount
        : b.createdAt.localeCompare(a.createdAt),
    );
    const start = (page - 1) * pageSize;
    return HttpResponse.json({
      items: sorted.slice(start, start + pageSize).map(forViewer),
      page,
      pageSize,
      total: sorted.length,
    });
  }),

  http.get('*/api/v1/ideas/:id', ({ params }) => {
    const parsedId = idParamsSchema.safeParse(params);
    if (!parsedId.success) return paramsInvalid(parsedId.error.issues);
    const idea = ideas.find((i) => i.id === parsedId.data.id);
    // Approved ideas are public; the rest only show to their creator or an admin.
    const viewer = authStore.sessionUser();
    const allowed =
      idea?.status === 'approved' ||
      (viewer !== null && (viewer.role === 'admin' || viewer.id === idea?.creator.id));
    if (!idea || !allowed) return errorResponse(404, 'NOT_FOUND', 'Idea not found');
    return HttpResponse.json(forViewer(idea));
  }),

  http.post('*/api/v1/ideas', async ({ request }) => {
    const me = sessionCreator();
    if (!me) return unauthorised();
    const parsed = ideaCreateSchema.safeParse(await request.json().catch(() => ({})));
    if (!parsed.success) {
      return validationResponse(
        parsed.error.issues.map((i) => ({
          location: 'body',
          path: i.path.map(String).join('.'),
          message: i.message,
        })),
      );
    }
    if (!isOwnImage(parsed.data.image)) {
      return validationResponse([
        {
          location: 'body',
          path: 'image',
          message: "Use an image uploaded through It's a Date",
        },
      ]);
    }
    const { tagIds, ...rest } = parsed.data;
    const chosen = tagIds.map((id) => tags.find((t) => t.id === id));
    if (chosen.some((t) => !t)) {
      return validationResponse([{ location: 'body', path: 'tagIds', message: 'Unknown tag' }]);
    }
    createdCount += 1;
    const idea: IdeaDTO = {
      ...rest,
      id: `64d${String(createdCount).padStart(21, '0')}`,
      tags: chosen.filter((t): t is TagDTO => t !== undefined),
      status: 'pending',
      ratingAvg: 0,
      ratingCount: 0,
      saveCount: 0,
      creator: me,
      createdAt: new Date().toISOString(),
      myRating: null,
      saved: false,
    };
    ideaStore.add(idea);
    return HttpResponse.json(idea, { status: 201 });
  }),

  http.get('*/api/v1/me/ideas', ({ request }) => {
    const me = sessionCreator();
    if (!me) return unauthorised();
    const sp = new URL(request.url).searchParams;
    const page = Math.max(1, Number(sp.get('page')) || 1);
    const pageSize = Math.min(48, Math.max(1, Number(sp.get('pageSize')) || 24));
    const mine = ideas
      .filter((i) => i.creator.id === me.id)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    const start = (page - 1) * pageSize;
    return HttpResponse.json({
      items: mine.slice(start, start + pageSize).map(forViewer),
      page,
      pageSize,
      total: mine.length,
    });
  }),

  // The pending queue is oldest first; other statuses newest first. `q` searches title and
  // description, case-insensitive, as a literal string.
  http.get('*/api/v1/admin/ideas', ({ request }) => {
    const denied = adminGate();
    if (denied) return denied;
    const parsed = adminIdeaQuerySchema.safeParse(
      Object.fromEntries(new URL(request.url).searchParams),
    );
    if (!parsed.success) return validationResponse(toIssues('query', parsed.error.issues));
    const { status, q, page, pageSize } = parsed.data;
    const rx = q ? new RegExp(escapeRegex(q), 'i') : null;
    const matches = ideas
      .filter((i) => i.status === status)
      .filter((i) => !rx || rx.test(i.title) || rx.test(i.description));
    const oldest = (a: IdeaDTO, b: IdeaDTO) =>
      a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id);
    const sorted = [...matches].sort(status === 'pending' ? oldest : (a, b) => oldest(b, a));
    const start = (page - 1) * pageSize;
    return HttpResponse.json({
      items: sorted.slice(start, start + pageSize).map(forViewer),
      page,
      pageSize,
      total: sorted.length,
    });
  }),

  http.patch('*/api/v1/admin/ideas/:id', async ({ params, request }) => {
    const denied = adminGate();
    if (denied) return denied;
    // Like the validate middleware: params and body issues are reported together.
    const parsedId = idParamsSchema.safeParse(params);
    const parsedBody = ideaUpdateSchema.safeParse(await request.json().catch(() => ({})));
    const issues = [
      ...(parsedId.success ? [] : toIssues('params', parsedId.error.issues)),
      ...(parsedBody.success ? [] : toIssues('body', parsedBody.error.issues)),
    ];
    if (!parsedId.success || !parsedBody.success) return validationResponse(issues);
    const idea = ideaStore.find(parsedId.data.id);
    if (!idea) return errorResponse(404, 'NOT_FOUND', 'Idea not found');
    const { tagIds, image, ...rest } = parsedBody.data;
    const inputIssues: ValidationIssue[] = [];
    if (image && !isOwnImage(image)) {
      inputIssues.push({
        location: 'body',
        path: 'image',
        message: "Use an image uploaded through It's a Date",
      });
    }
    const chosen = tagIds?.map((id) => tags.find((t) => t.id === id));
    if (chosen?.some((t) => !t)) {
      inputIssues.push({ location: 'body', path: 'tagIds', message: 'Unknown tag' });
    }
    if (inputIssues.length > 0) return validationResponse(inputIssues);
    const updated: IdeaDTO = {
      ...idea,
      ...rest,
      ...(image ? { image } : {}),
      ...(chosen ? { tags: chosen.filter((t): t is TagDTO => t !== undefined) } : {}),
    };
    ideaStore.set(ideas.map((i) => (i.id === idea.id ? updated : i)));
    return HttpResponse.json(forViewer(updated));
  }),

  http.delete('*/api/v1/admin/ideas/:id', ({ params }) => {
    const denied = adminGate();
    if (denied) return denied;
    const parsedId = idParamsSchema.safeParse(params);
    if (!parsedId.success) return validationResponse(toIssues('params', parsedId.error.issues));
    if (!ideaStore.find(parsedId.data.id)) return errorResponse(404, 'NOT_FOUND', 'Idea not found');
    ideaStore.set(ideas.filter((i) => i.id !== parsedId.data.id));
    return new HttpResponse(null, { status: 204 });
  }),

  http.post('*/api/v1/uploads/image', async () => {
    if (!sessionCreator()) return unauthorised();
    if (uploadDelayMs > 0) await new Promise((r) => setTimeout(r, uploadDelayMs));
    if (uploadMode === 'network') return HttpResponse.error();
    if (uploadMode === 'reject') {
      return errorResponse(422, 'VALIDATION', 'Use a JPEG, PNG or WebP image under 5 MB');
    }
    uploadCount += 1;
    return HttpResponse.json(uploadedImage(uploadCount), { status: 201 });
  }),
];
