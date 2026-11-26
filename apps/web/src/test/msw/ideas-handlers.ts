import {
  ideaCreateSchema,
  ideaQuerySchema,
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

function unauthorised() {
  return errorResponse(401, 'UNAUTHORIZED', 'Please log in');
}

/** The session user as a fixture creator: fixture people keep their fixture id. */
function sessionCreator(): { id: string; name: string } | null {
  const user = authStore.sessionUser();
  if (!user) return null;
  const fixture = users.find((u) => u.email === user.email);
  return fixture ? { id: fixture.id, name: fixture.name } : { id: user.id, name: user.name };
}

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
    const idea = ideas.find((i) => i.id === params.id);
    if (!idea || idea.status !== 'approved') {
      return errorResponse(404, 'NOT_FOUND', 'Idea not found');
    }
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
    const { tagIds, ...rest } = parsed.data;
    const chosen = tagIds.map((id) => tags.find((t) => t.id === id));
    if (chosen.some((t) => !t)) {
      return validationResponse([{ location: 'body', path: 'tagIds', message: 'Unknown tag' }]);
    }
    createdCount += 1;
    const idea: IdeaDTO = {
      ...rest,
      id: `new-idea-${createdCount}`,
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

  http.post('*/api/v1/uploads/image', async () => {
    if (!sessionCreator()) return unauthorised();
    if (uploadDelayMs > 0) await new Promise((r) => setTimeout(r, uploadDelayMs));
    if (uploadMode === 'network') return HttpResponse.error();
    if (uploadMode === 'reject') {
      return errorResponse(422, 'VALIDATION', 'Use a JPEG, PNG or WebP image under 5 MB');
    }
    uploadCount += 1;
    return HttpResponse.json(
      {
        url: `https://res.cloudinary.com/itsadate/image/upload/test-${uploadCount}.jpg`,
        publicId: `itsadate/test-${uploadCount}`,
      },
      { status: 201 },
    );
  }),
];
