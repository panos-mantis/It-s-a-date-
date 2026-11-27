import type { IdeaDTO } from '@itsadate/shared';
import { act, screen, waitFor, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { expectNoAxeViolations } from '../../test/axe';
import { ideaFixtures } from '../../test/fixtures/ideas';
import { ideaStore } from '../../test/msw/ideas-handlers';
import { server } from '../../test/msw/server';
import { renderApp } from '../../test/render';

// Idea 1 was created Nov 24 (1 day old, "New"); idea 2 on Nov 22 (3 days old, not new).
const NOW = new Date('2026-11-25T12:00:00.000Z');

function fixture(title: string): IdeaDTO {
  const found = ideaFixtures.find((i) => i.title === title);
  if (!found) throw new Error(`No fixture titled ${title}`);
  return found;
}

/** Records every GET /ideas query, then lets the default handler answer. */
function spyOnIdeas(): URLSearchParams[] {
  const seen: URLSearchParams[] = [];
  server.use(
    http.get('*/api/v1/ideas', ({ request }) => {
      seen.push(new URL(request.url).searchParams);
    }),
  );
  return seen;
}

function card(title: string): HTMLElement {
  const article = screen.getByRole('link', { name: title }).closest('article');
  if (!article) throw new Error(`No card for ${title}`);
  return article;
}

function manyIdeas(n: number): IdeaDTO[] {
  const base = fixture('Dumpling crawl');
  return Array.from({ length: n }, (_, i) => ({
    ...base,
    id: `64b1${String(i + 1).padStart(20, '0')}`,
    title: `Idea number ${i + 1}`,
    createdAt: new Date(Date.UTC(2026, 9, 30 - i)).toISOString(),
  }));
}

async function findGrid() {
  await screen.findByRole('link', { name: 'Salsa social night' });
}

beforeEach(() => {
  // Only Date is faked, so MSW, React Query and waitFor keep their real timers.
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(NOW);
});

afterEach(() => {
  vi.useRealTimers();
});

describe('Home', () => {
  it('renders approved ideas from the API', async () => {
    renderApp('/');
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Plans worth saying yes to.' }),
    ).toBeInTheDocument();
    expect(await screen.findByRole('link', { name: 'Salsa social night' })).toHaveAttribute(
      'href',
      '/ideas/64b000000000000000000001',
    );
    expect(screen.getAllByRole('article')).toHaveLength(12);
    // Pending and rejected ideas never reach the grid.
    expect(screen.queryByRole('link', { name: 'Sunday pastry walk' })).not.toBeInTheDocument();

    const dumplings = card('Dumpling crawl');
    expect(within(dumplings).getByText('$$ · 1–2 hours')).toBeInTheDocument();
    expect(within(dumplings).getByText('Food')).toBeInTheDocument();
    expect(within(dumplings).getByText('Rated 4.6 out of 5 from 128 ratings')).toBeInTheDocument();
    // Browse cards show the first tag only.
    expect(
      within(card('Bookshop and coffee afternoon')).getByText('Self-date'),
    ).toBeInTheDocument();
    expect(within(card('Bookshop and coffee afternoon')).queryByText('Learning')).toBeNull();
  });

  it('shows "New" only on ideas from the last 2 days', async () => {
    renderApp('/');
    await findGrid();
    expect(within(card('Salsa social night')).getByText('New')).toBeInTheDocument();
    expect(
      within(
        card('A slow Saturday at the farmers market, then a picnic lunch by the river for two!'),
      ).queryByText('New'),
    ).not.toBeInTheDocument();
  });

  it('shows card skeletons while loading', async () => {
    renderApp('/');
    expect(await screen.findByText('Loading ideas…')).toBeInTheDocument();
    await findGrid();
    expect(screen.queryByText('Loading ideas…')).not.toBeInTheDocument();
  });

  it('URL filters drive the request and the controls', async () => {
    const seen = spyOnIdeas();
    renderApp('/?tag=food&budget=2');
    expect(await screen.findByRole('link', { name: 'Dumpling crawl' })).toBeInTheDocument();
    expect(screen.getAllByRole('article')).toHaveLength(1);

    const last = seen.at(-1);
    expect(last?.get('tag')).toBe('food');
    expect(last?.get('budget')).toBe('2');

    const search = screen.getByRole('search');
    expect(within(search).getByLabelText('Vibe')).toHaveValue('food');
    expect(within(search).getByLabelText('Budget')).toHaveValue('2');
    const vibes = screen.getByRole('navigation', { name: 'Vibes' });
    expect(await within(vibes).findByRole('button', { name: 'Food' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(within(vibes).getByRole('button', { name: 'All' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
  });

  it('the search bar submits into the URL, pushing history', async () => {
    const { router, user } = renderApp('/');
    await findGrid();
    const search = screen.getByRole('search');
    await user.type(within(search).getByLabelText('What'), 'dumpling');
    await user.click(within(search).getByRole('button', { name: 'Search' }));
    expect(await screen.findByRole('link', { name: 'Dumpling crawl' })).toBeInTheDocument();
    await waitFor(() => expect(screen.getAllByRole('article')).toHaveLength(1));
    expect(router.state.location.search).toBe('?q=dumpling');
    expect(router.state.historyAction).toBe('PUSH');
  });

  it('Back restores the previous filters', async () => {
    const { router, user } = renderApp('/?budget=3');
    expect(await screen.findByRole('link', { name: 'Sushi counter night' })).toBeInTheDocument();
    const vibes = screen.getByRole('navigation', { name: 'Vibes' });
    await user.click(await within(vibes).findByRole('button', { name: 'Dancing' }));
    expect(router.state.location.search).toBe('?tag=dancing&budget=3');
    expect(
      await screen.findByRole('link', { name: 'Dress-up night at a jazz club' }),
    ).toBeVisible();
    await waitFor(() => expect(screen.getAllByRole('article')).toHaveLength(1));

    await act(() => router.navigate(-1));
    expect(router.state.location.search).toBe('?budget=3');
    expect(within(vibes).getByRole('button', { name: 'All' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(within(screen.getByRole('search')).getByLabelText('Budget')).toHaveValue('3');
    expect(await screen.findByRole('link', { name: 'Sushi counter night' })).toBeInTheDocument();
    expect(screen.getAllByRole('article')).toHaveLength(3);
  });

  it('junk params are ignored', async () => {
    const seen = spyOnIdeas();
    renderApp('/?budget=7&sort=hot&tag=Bad%20Tag&duration=forever&page=-1');
    await findGrid();
    expect(screen.queryByText("We couldn't load ideas.")).not.toBeInTheDocument();
    const last = seen.at(-1);
    expect(last?.get('budget')).toBeNull();
    expect(last?.get('tag')).toBeNull();
    expect(last?.get('duration')).toBeNull();
    expect(last?.get('sort')).toBe('new');
    expect(last?.get('page')).toBe('1');
    expect(within(screen.getByRole('search')).getByLabelText('Budget')).toHaveValue('');
    expect(screen.getByRole('button', { name: 'New' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('the sort toggle sets sort', async () => {
    const seen = spyOnIdeas();
    const { router, user } = renderApp('/');
    await findGrid();
    const sort = screen.getByRole('group', { name: 'Sort ideas' });
    await user.click(within(sort).getByRole('button', { name: 'Top rated' }));
    expect(router.state.location.search).toBe('?sort=top');
    expect(within(sort).getByRole('button', { name: 'Top rated' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await waitFor(() => expect(seen.at(-1)?.get('sort')).toBe('top'));
    await waitFor(() =>
      expect(screen.getAllByRole('article')[0]).toHaveTextContent('Bookshop and coffee afternoon'),
    );
  });

  it('the Filters popover sets the duration and shows a count', async () => {
    const { router, user } = renderApp('/');
    await findGrid();
    const filters = screen.getByRole('button', { name: 'Filters' });
    expect(filters).toHaveAttribute('aria-expanded', 'false');
    await user.click(filters);
    expect(filters).toHaveAttribute('aria-expanded', 'true');
    const group = screen.getByRole('group', { name: 'Duration' });
    await user.click(within(group).getByRole('button', { name: 'Full day' }));
    expect(router.state.location.search).toBe('?duration=full-day');
    expect(
      await screen.findByRole('link', {
        name: 'A slow Saturday at the farmers market, then a picnic lunch by the river for two!',
      }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Filters, 1 filter on' })).toBeInTheDocument();

    await user.keyboard('{Escape}');
    expect(screen.queryByRole('group', { name: 'Duration' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Filters, 1 filter on' })).toHaveFocus();
  });

  it('re-applying the same filters adds no history entry', async () => {
    const { router, user } = renderApp('/?tag=food&budget=2');
    expect(await screen.findByRole('link', { name: 'Dumpling crawl' })).toBeInTheDocument();
    const before = router.state.location.key;

    await user.click(within(screen.getByRole('search')).getByRole('button', { name: 'Search' }));
    const vibes = screen.getByRole('navigation', { name: 'Vibes' });
    await user.click(await within(vibes).findByRole('button', { name: 'Food' }));
    await user.click(screen.getByRole('button', { name: 'New' }));

    expect(router.state.location.key).toBe(before);
    expect(router.state.historyAction).toBe('POP');
    expect(router.state.location.search).toBe('?tag=food&budget=2');
  });

  it('caps What at 100 characters, like the API', async () => {
    const { user } = renderApp('/');
    await findGrid();
    expect(within(screen.getByRole('search')).getByLabelText('What')).toHaveAttribute(
      'maxlength',
      '100',
    );
    await user.click(screen.getByRole('button', { name: /Find a date idea/ }));
    const sheet = screen.getByRole('dialog', { name: 'Find a date idea' });
    expect(within(sheet).getByLabelText('What')).toHaveAttribute('maxlength', '100');
  });

  it('Show more loads page 2', async () => {
    ideaStore.set(manyIdeas(30));
    const seen = spyOnIdeas();
    const { user } = renderApp('/');
    expect(await screen.findByRole('link', { name: 'Idea number 1' })).toBeInTheDocument();
    expect(screen.getAllByRole('article')).toHaveLength(24);

    await user.click(screen.getByRole('button', { name: 'Show more' }));
    expect(await screen.findByRole('link', { name: 'Idea number 30' })).toBeInTheDocument();
    expect(screen.getAllByRole('article')).toHaveLength(30);
    expect(seen.at(-1)?.get('page')).toBe('2');
    expect(screen.queryByRole('button', { name: 'Show more' })).not.toBeInTheDocument();
  });

  it('Show more failing keeps the grid and says so in a toast', async () => {
    ideaStore.set(manyIdeas(30));
    server.use(
      http.get('*/api/v1/ideas', ({ request }) => {
        if (new URL(request.url).searchParams.get('page') !== '1') {
          return HttpResponse.json({ error: { code: 'X', message: 'no' } }, { status: 500 });
        }
        return undefined;
      }),
    );
    const { user } = renderApp('/');
    expect(await screen.findByRole('link', { name: 'Idea number 1' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Show more' }));
    expect(
      await screen.findByText("We couldn't load more ideas. Check your connection and try again."),
    ).toBeInTheDocument();
    expect(screen.getAllByRole('article')).toHaveLength(24);
    expect(screen.queryByText("We couldn't load ideas.")).not.toBeInTheDocument();
  });

  it('idea with no photo, no budget/duration, no ratings shows placeholder, no meta line, no rating', async () => {
    ideaStore.set([
      { ...fixture('Planetarium show'), image: null, ratingAvg: 0, ratingCount: 0 },
      fixture('Dumpling crawl'),
    ]);
    renderApp('/');
    expect(await screen.findByRole('link', { name: 'Planetarium show' })).toBeInTheDocument();
    const bare = card('Planetarium show');
    expect(bare.querySelector('img')).toBeNull();
    expect(within(bare).queryByText(/\$|hours|day/)).not.toBeInTheDocument();
    expect(within(bare).queryByText(/null/)).not.toBeInTheDocument();
    expect(within(bare).queryByText(/Rated/)).not.toBeInTheDocument();
    expect(within(bare).getByText('Learning')).toBeInTheDocument();
    // The other card keeps its photo, so the placeholder is specific to the missing image.
    expect(card('Dumpling crawl').querySelector('img')).not.toBeNull();
  });

  it('empty filters state clears filters', async () => {
    const { router, user } = renderApp('/?q=rooftop&tag=dancing&budget=2&sort=top');
    expect(
      await screen.findByRole('heading', { name: 'No ideas match those filters.' }),
    ).toBeInTheDocument();
    expect(
      await screen.findByText(
        'Nothing for "rooftop" in Dancing at $$. Try another vibe or budget.',
      ),
    ).toBeInTheDocument();
    await user.click(screen.getByRole('link', { name: 'Clear filters' }));
    expect(router.state.location.search).toBe('?sort=top');
    expect(await screen.findByRole('link', { name: 'Salsa social night' })).toBeInTheDocument();
    expect(within(screen.getByRole('search')).getByLabelText('What')).toHaveValue('');
  });

  it('a category with no ideas reads as a filter with Clear filters, not as an empty site', async () => {
    ideaStore.set([fixture('Sushi counter night')].map((i) => ({ ...i, tags: [] })));
    const { user, router } = renderApp('/?tag=learning');
    expect(
      await screen.findByRole('heading', { name: 'No ideas match those filters.' }),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Nothing in Learning. Try another vibe or budget.'),
    ).toBeInTheDocument();
    expect(screen.queryByText('Be the first to share one.')).not.toBeInTheDocument();
    await user.click(screen.getByRole('link', { name: 'Clear filters' }));
    expect(router.state.location.search).toBe('');
  });

  it('with no ideas at all, invites you to share one', async () => {
    ideaStore.set([]);
    renderApp('/');
    expect(await screen.findByRole('heading', { name: 'No ideas here yet.' })).toBeInTheDocument();
    expect(screen.getByText('Be the first to share one.')).toBeInTheDocument();
    expect(
      within(screen.getByRole('main')).getByRole('link', { name: 'Share an idea' }),
    ).toHaveAttribute('href', '/share');
    expect(screen.queryByRole('button', { name: 'Show more' })).not.toBeInTheDocument();
  });

  it("500 shows Couldn't load, and Try again refetches", async () => {
    server.use(
      http.get(
        '*/api/v1/ideas',
        () =>
          HttpResponse.json(
            { error: { code: 'INTERNAL', message: 'Something went wrong' } },
            { status: 500 },
          ),
        { once: true },
      ),
    );
    const { user } = renderApp('/?tag=food');
    const main = await screen.findByRole('main');
    expect(await within(main).findByRole('alert')).toHaveTextContent("We couldn't load ideas.");
    expect(screen.getByText('Check your connection and try again.')).toBeInTheDocument();
    // The search keeps its values, so Try again repeats the same request.
    expect(within(screen.getByRole('search')).getByLabelText('Vibe')).toHaveValue('food');

    await user.click(screen.getByRole('button', { name: 'Try again' }));
    expect(await screen.findByRole('link', { name: 'Dumpling crawl' })).toBeInTheDocument();
    expect(screen.queryByText("We couldn't load ideas.")).not.toBeInTheDocument();
  });

  it('has no axe violations with data', async () => {
    const { container } = renderApp('/');
    await findGrid();
    await screen.findByRole('button', { name: 'Food' });
    await expectNoAxeViolations(container);
  });

  it('has no axe violations on the empty state', async () => {
    const { container } = renderApp('/?q=rooftop');
    await screen.findByRole('heading', { name: 'No ideas match those filters.' });
    await expectNoAxeViolations(container);
  });
});

describe('SearchSheet', () => {
  it('Show ideas applies all fields', async () => {
    const { router, user } = renderApp('/');
    await findGrid();
    const pill = screen.getByRole('button', { name: /Find a date idea/ });
    expect(pill).toHaveTextContent('Any vibe · Any budget · Any length');
    await user.click(pill);

    const sheet = screen.getByRole('dialog', { name: 'Find a date idea' });
    expect(within(sheet).getByLabelText('What')).toHaveFocus();
    await user.type(within(sheet).getByLabelText('What'), 'picnic');
    await user.click(
      within(within(sheet).getByRole('group', { name: 'Vibe' })).getByRole('button', {
        name: 'Food',
      }),
    );
    const budget = within(sheet).getByRole('group', { name: 'Budget' });
    // Tap again to clear.
    await user.click(within(budget).getByRole('button', { name: '$$' }));
    expect(within(budget).getByRole('button', { name: '$$' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await user.click(within(budget).getByRole('button', { name: '$$' }));
    expect(within(budget).getByRole('button', { name: '$$' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
    await user.click(within(budget).getByRole('button', { name: '$' }));
    await user.click(
      within(within(sheet).getByRole('group', { name: 'Duration' })).getByRole('button', {
        name: 'Full day',
      }),
    );
    await user.click(within(sheet).getByRole('button', { name: 'Show ideas' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(router.state.location.search).toBe('?q=picnic&tag=food&budget=1&duration=full-day');
    const after = screen.getByRole('button', { name: /Find a date idea/ });
    expect(after).toHaveTextContent('picnic · Food · $ · Full day');
    expect(after).toHaveFocus();
    expect(
      await screen.findByRole('link', {
        name: 'A slow Saturday at the farmers market, then a picnic lunch by the river for two!',
      }),
    ).toBeInTheDocument();
  });

  it('Clear all empties the sheet, and Escape closes it without applying', async () => {
    const { router, user } = renderApp('/?q=picnic&tag=food');
    await screen.findByRole('link', {
      name: 'A slow Saturday at the farmers market, then a picnic lunch by the river for two!',
    });
    await user.click(screen.getByRole('button', { name: /Find a date idea/ }));
    const sheet = screen.getByRole('dialog', { name: 'Find a date idea' });
    expect(within(sheet).getByLabelText('What')).toHaveValue('picnic');
    expect(within(sheet).getByRole('button', { name: 'Food' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await user.click(within(sheet).getByRole('button', { name: 'Clear all' }));
    expect(within(sheet).getByLabelText('What')).toHaveValue('');
    expect(within(sheet).getByRole('button', { name: 'Food' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(router.state.location.search).toBe('?q=picnic&tag=food');
  });

  it('has no axe violations while open', async () => {
    const { user } = renderApp('/');
    await findGrid();
    await screen.findByRole('button', { name: 'Food' });
    await user.click(screen.getByRole('button', { name: /Find a date idea/ }));
    await expectNoAxeViolations(document.body);
  });
});
