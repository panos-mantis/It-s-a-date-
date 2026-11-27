import type { IdeaDTO } from '@itsadate/shared';
import { screen, waitFor, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { expectNoAxeViolations } from '../../test/axe';
import { ideaFixtures } from '../../test/fixtures/ideas';
import { ideaStore } from '../../test/msw/ideas-handlers';
import { server } from '../../test/msw/server';
import { renderApp } from '../../test/render';

function fixture(title: string): IdeaDTO {
  const found = ideaFixtures.find((i) => i.title === title);
  if (!found) throw new Error(`No fixture titled ${title}`);
  return found;
}

const golden = fixture('Golden-hour viewpoint drive');
const long = fixture(
  'A slow Saturday at the farmers market, then a picnic lunch by the river for two!',
);

describe('Detail', () => {
  it("shows the date in the reader's time zone, the same day Admin shows", async () => {
    const original = process.env.TZ;
    process.env.TZ = 'Pacific/Auckland';
    try {
      ideaStore.set([{ ...golden, createdAt: '2026-11-24T23:30:00.000Z' }]);
      renderApp(`/ideas/${golden.id}`);
      expect(await screen.findByText(/· Nov 25, 2026/)).toBeInTheDocument();
    } finally {
      process.env.TZ = original;
    }
  });

  it('renders idea 5 fields', async () => {
    renderApp(`/ideas/${golden.id}`);
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Golden-hour viewpoint drive' }),
    ).toBeInTheDocument();
    expect(screen.getByText('$ · Half day')).toBeInTheDocument();
    expect(screen.getByText('Rated 4.7 out of 5 from 89 ratings')).toBeInTheDocument();
    expect(screen.getByText('4.7 · 89 ratings')).toBeInTheDocument();
    expect(screen.getByText('Sam Okafor')).toBeInTheDocument();
    expect(screen.getByText(/· Nov 10, 2026/)).toBeInTheDocument();
    expect(screen.getByText(/Shared by/)).toBeInTheDocument();
    expect(screen.getByText('Adventure')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'About this date' })).toBeInTheDocument();
    expect(screen.getByText(/Chase the last hour of daylight/)).toBeInTheDocument();
    expect(screen.getByRole('img', { name: golden.title })).toHaveAttribute(
      'src',
      golden.image?.url,
    );
    expect(screen.getByRole('link', { name: 'All ideas' })).toHaveAttribute('href', '/');
    expect(document.title).toBe("Golden-hour viewpoint drive · It's a Date");
    // Hearts, the rating panel and places come in later phases.
    expect(screen.queryByRole('button', { name: /saved/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('radio')).not.toBeInTheDocument();
    expect(screen.queryByText('Find places near me')).not.toBeInTheDocument();
  });

  it('shows a skeleton while loading', async () => {
    renderApp(`/ideas/${golden.id}`);
    expect(screen.getByText('Loading idea…')).toBeInTheDocument();
    await screen.findByRole('heading', { level: 1, name: golden.title });
    expect(screen.queryByText('Loading idea…')).not.toBeInTheDocument();
  });

  it('no photo and no ratings', async () => {
    ideaStore.set([{ ...golden, image: null, ratingAvg: 0, ratingCount: 0 }]);
    renderApp(`/ideas/${golden.id}`);
    await screen.findByRole('heading', { level: 1, name: golden.title });
    expect(screen.getByText('No ratings yet. Be the first.')).toBeInTheDocument();
    expect(screen.queryByRole('img', { name: golden.title })).not.toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('missing budget and duration hides the meta line', async () => {
    ideaStore.set([{ ...golden, budget: null, duration: null }]);
    renderApp(`/ideas/${golden.id}`);
    await screen.findByRole('heading', { level: 1, name: golden.title });
    expect(screen.queryByText(/Half day/)).not.toBeInTheDocument();
    expect(screen.queryByText('$')).not.toBeInTheDocument();
    expect(screen.getByText('Rated 4.7 out of 5 from 89 ratings')).toBeInTheDocument();
  });

  it('2000-character description and 80-character title render in full', async () => {
    expect(long.title).toHaveLength(80);
    expect(long.description).toHaveLength(2000);
    renderApp(`/ideas/${long.id}`);
    expect(await screen.findByRole('heading', { level: 1, name: long.title })).toBeInTheDocument();
    const about = screen.getByRole('region', { name: 'About this date' });
    const paragraphs = within(about).getAllByText(/./, { selector: 'p' });
    expect(paragraphs).toHaveLength(long.description.split('\n\n').length);
    expect(paragraphs.map((p) => p.textContent).join('\n\n')).toBe(long.description);
    expect(screen.getByText(long.creator.name)).toBeInTheDocument();
  });

  it('pending id shows not found', async () => {
    const pending = ideaFixtures.find((i) => i.status === 'pending');
    renderApp(`/ideas/${pending?.id}`);
    expect(
      await screen.findByRole('heading', { level: 1, name: "We couldn't find that idea." }),
    ).toBeInTheDocument();
    expect(screen.getByText("It may have been removed, or it isn't public yet.")).toBeVisible();
    expect(screen.getByRole('link', { name: 'Back to all ideas' })).toHaveAttribute('href', '/');
    expect(screen.queryByText(pending?.title ?? '')).not.toBeInTheDocument();
  });

  it('a malformed id shows not found', async () => {
    renderApp('/ideas/nope');
    expect(
      await screen.findByRole('heading', { level: 1, name: "We couldn't find that idea." }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Try again' })).not.toBeInTheDocument();
  });

  it('network error shows Try again', async () => {
    let fail = true;
    server.use(http.get('*/api/v1/ideas/:id', () => (fail ? HttpResponse.error() : undefined)));
    const { user } = renderApp(`/ideas/${golden.id}`);
    expect(await screen.findByRole('button', { name: 'Try again' })).toBeInTheDocument();
    expect(within(screen.getByRole('main')).getByRole('alert')).toHaveTextContent(
      "We couldn't load this idea.",
    );
    fail = false;
    await user.click(screen.getByRole('button', { name: 'Try again' }));
    expect(
      await screen.findByRole('heading', { level: 1, name: golden.title }),
    ).toBeInTheDocument();
  });

  it('has no axe violations', async () => {
    const { container } = renderApp(`/ideas/${golden.id}`);
    await screen.findByRole('heading', { level: 1, name: golden.title });
    await waitFor(() => expect(screen.getByRole('main')).toBeInTheDocument());
    await expectNoAxeViolations(container);
  });
});
