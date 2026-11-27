import { screen, waitFor, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { expectNoAxeViolations } from '../../test/axe';
import { authStore } from '../../test/msw/handlers';
import { ideaStore } from '../../test/msw/ideas-handlers';
import { server } from '../../test/msw/server';
import { renderApp } from '../../test/render';

const PASTRY = '64b000000000000000000013';
const BOOKSHOP = '64b000000000000000000015';
const SKATING = '64b000000000000000000016';
const BOOKSHOP_TITLE = "Pick each other's next read at a secondhand bookshop";

type Seen = { method: string; path: string; search: URLSearchParams; body: unknown };
let seen: Seen[] = [];
const listener = async ({ request }: { request: Request }) => {
  const url = new URL(request.url);
  if (!url.pathname.startsWith('/api/v1/admin/')) return;
  const body = ['PATCH', 'POST'].includes(request.method)
    ? ((await request.clone().json()) as unknown)
    : undefined;
  seen.push({ method: request.method, path: url.pathname, search: url.searchParams, body });
};
const writes = () => seen.filter((s) => s.method !== 'GET');

beforeEach(() => {
  // Only Date is faked: "Submitted" reads relative to Nov 25, 2026, like the design.
  vi.useFakeTimers({ toFake: ['Date'], now: new Date('2026-11-25T15:00:00.000Z') });
  authStore.addUser({
    name: 'Panos',
    email: 'panos@example.com',
    password: 'password1',
    role: 'admin',
  });
  authStore.loginAs('panos@example.com');
  seen = [];
  server.events.on('request:start', listener);
});
afterEach(() => {
  server.events.removeListener('request:start', listener);
  vi.useRealTimers();
});

async function openAdmin(path = '/admin') {
  const view = renderApp(path);
  await screen.findByRole('heading', { level: 1, name: 'Admin' });
  return view;
}

async function queue() {
  return screen.findByRole('table', { name: 'Ideas waiting for review, oldest first' });
}

function rowOf(title: string): HTMLElement {
  const row = screen
    .getAllByText(title, { selector: 'button, a' })
    .map((el) => el.closest('tr'))
    .find(Boolean);
  if (!row) throw new Error(`No row for ${title}`);
  return row;
}

function queueTitles(table: HTMLElement): string[] {
  return within(table)
    .getAllByRole('row')
    .slice(1)
    .map((r) => within(r).getAllByRole('button')[0]!.textContent ?? '');
}

describe('Admin', () => {
  it('pending queue oldest first with count', async () => {
    await openAdmin();
    const table = await queue();
    expect(screen.getByRole('tab', { name: 'Pending 3' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('heading', { name: '3 ideas waiting for review' })).toBeInTheDocument();
    expect(queueTitles(table)).toEqual([
      'Ice skating and hot chocolate',
      BOOKSHOP_TITLE,
      'Sunday pastry walk',
    ]);

    const skating = rowOf('Ice skating and hot chocolate');
    expect(within(skating).getByText('No budget or duration yet')).toBeInTheDocument();
    expect(within(skating).getByRole('img', { name: 'No photo yet' })).toBeInTheDocument();
    expect(within(skating).getByText('Lena Brooks')).toBeInTheDocument();
    expect(within(skating).getByText('Mar 9, 2024')).toBeInTheDocument();

    const bookshop = rowOf(BOOKSHOP_TITLE);
    expect(within(bookshop).getByText('Cafe · $ · 1–2 hours')).toBeInTheDocument();
    expect(within(bookshop).getByText('3 days ago')).toBeInTheDocument();
    expect(within(bookshop).getByText('Learning')).toBeInTheDocument();
    expect(within(bookshop).getByText('Food')).toBeInTheDocument();
    expect(within(rowOf('Sunday pastry walk')).getByText('today')).toBeInTheDocument();

    // Row actions name the idea they act on.
    expect(within(bookshop).getByRole('button', { name: 'Approve' })).toHaveAccessibleDescription(
      BOOKSHOP_TITLE,
    );
    expect(seen[0]?.search.get('status')).toBe('pending');
  });

  it('approve, then Undo restores pending and the count', async () => {
    const { user } = await openAdmin();
    await queue();
    await user.click(within(rowOf('Sunday pastry walk')).getByRole('button', { name: 'Approve' }));

    expect(await screen.findByText('Idea approved')).toBeInTheDocument();
    expect(writes()).toEqual([
      expect.objectContaining({
        method: 'PATCH',
        path: `/api/v1/admin/ideas/${PASTRY}`,
        body: { status: 'approved' },
      }),
    ]);
    await waitFor(() =>
      expect(screen.queryByRole('button', { name: 'Sunday pastry walk' })).not.toBeInTheDocument(),
    );
    expect(screen.getByRole('tab', { name: 'Pending 2' })).toBeInTheDocument();
    // It was the last row, so focus moves to the row before it.
    expect(within(rowOf(BOOKSHOP_TITLE)).getByRole('button', { name: 'Approve' })).toHaveFocus();

    await user.click(screen.getByRole('button', { name: 'Undo' }));
    expect(await screen.findByText('Back in the queue.')).toBeInTheDocument();
    expect(writes()[1]).toEqual(
      expect.objectContaining({
        method: 'PATCH',
        path: `/api/v1/admin/ideas/${PASTRY}`,
        body: { status: 'pending' },
      }),
    );
    expect(queueTitles(await queue())).toEqual([
      'Ice skating and hot chocolate',
      BOOKSHOP_TITLE,
      'Sunday pastry walk',
    ]);
    expect(screen.getByRole('tab', { name: 'Pending 3' })).toBeInTheDocument();
    await waitFor(() =>
      expect(
        within(rowOf('Sunday pastry walk')).getByRole('button', { name: 'Approve' }),
      ).toHaveFocus(),
    );
  });

  it('a failed approve keeps the row and says so', async () => {
    server.use(
      http.patch('*/api/v1/admin/ideas/:id', () =>
        HttpResponse.json({ error: { code: 'INTERNAL', message: 'Boom' } }, { status: 500 }),
      ),
    );
    const { user } = await openAdmin();
    await queue();
    await user.click(within(rowOf('Sunday pastry walk')).getByRole('button', { name: 'Approve' }));
    const message = await screen.findByText("We couldn't approve that. Try again.");
    expect(message.closest('[role="alert"]')).not.toBeNull();
    expect(rowOf('Sunday pastry walk')).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Pending 3' })).toBeInTheDocument();
  });

  it('reject asks first; Cancel does nothing', async () => {
    const { user } = await openAdmin();
    await queue();
    const reject = within(rowOf(BOOKSHOP_TITLE)).getByRole('button', { name: 'Reject' });
    await user.click(reject);

    const dialog = screen.getByRole('alertdialog', { name: `Reject "${BOOKSHOP_TITLE}"?` });
    expect(dialog).toHaveAccessibleDescription(
      'The author will see it as not approved. It stays off Home, and you can still change it from All ideas.',
    );
    const cancel = within(dialog).getByRole('button', { name: 'Cancel' });
    expect(cancel).toHaveFocus();
    await user.click(cancel);
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    expect(writes()).toEqual([]);
    expect(rowOf(BOOKSHOP_TITLE)).toBeInTheDocument();
    await waitFor(() => expect(reject).toHaveFocus());

    await user.click(reject);
    await user.click(screen.getByRole('button', { name: 'Reject idea' }));
    expect(await screen.findByText('Idea marked as not approved.')).toBeInTheDocument();
    expect(writes()).toEqual([
      expect.objectContaining({
        method: 'PATCH',
        path: `/api/v1/admin/ideas/${BOOKSHOP}`,
        body: { status: 'rejected' },
      }),
    ]);
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: BOOKSHOP_TITLE })).not.toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Pending 2' })).toBeInTheDocument();
    // Focus moves to the next row's Approve.
    expect(
      within(rowOf('Sunday pastry walk')).getByRole('button', { name: 'Approve' }),
    ).toHaveFocus();
  });

  it('edit saves only changed fields and refreshes the row', async () => {
    const { user } = await openAdmin();
    await queue();
    await user.click(screen.getByRole('button', { name: 'Ice skating and hot chocolate' }));

    const panel = screen.getByRole('dialog', { name: 'Edit idea' });
    expect(within(panel).getByRole('heading', { name: 'Edit idea' })).toHaveFocus();
    expect(
      within(panel).getByText('By Lena Brooks · Submitted on Mar 9, 2024'),
    ).toBeInTheDocument();
    expect(within(panel).getByRole('radio', { name: 'Pending review' })).toBeChecked();
    const budget = within(panel).getByRole('radiogroup', { name: 'Budget' });
    expect(within(budget).getByRole('radio', { name: 'Not set' })).toBeChecked();
    expect(within(budget).getByRole('radio', { name: 'Not set' })).toBeEnabled();
    expect(
      within(panel).getByText(
        'Migrated ideas start without a budget or duration. Once you set one, "Not set" can\'t be picked again.',
      ),
    ).toBeInTheDocument();
    expect(within(panel).getByRole('button', { name: 'Adventure' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );

    const title = within(panel).getByLabelText('Title');
    await user.clear(title);
    await user.type(title, 'Ice skating, then hot chocolate');
    await user.click(within(budget).getByRole('radio', { name: '$, low budget' }));
    // Tags compare as sets: unpicking and picking the same tag again is no change.
    await user.click(within(panel).getByRole('button', { name: 'Adventure' }));
    await user.click(within(panel).getByRole('button', { name: 'Adventure' }));
    await user.click(within(panel).getByRole('button', { name: 'Save changes' }));

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(writes()).toEqual([
      expect.objectContaining({
        method: 'PATCH',
        path: `/api/v1/admin/ideas/${SKATING}`,
        body: { title: 'Ice skating, then hot chocolate', budget: 1 },
      }),
    ]);
    expect(await screen.findByText('Changes saved')).toBeInTheDocument();
    const row = await waitFor(() => rowOf('Ice skating, then hot chocolate'));
    expect(within(row).getByText('Park · $')).toBeInTheDocument();
    // Focus goes back to what opened the panel.
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Ice skating, then hot chocolate' })).toHaveFocus(),
    );

    // Once a budget is set, "Not set" can't be picked again.
    await user.click(screen.getByRole('button', { name: 'Ice skating, then hot chocolate' }));
    const again = within(screen.getByRole('dialog', { name: 'Edit idea' }));
    expect(
      within(again.getByRole('radiogroup', { name: 'Budget' })).getByRole('radio', {
        name: 'Not set',
      }),
    ).toBeDisabled();
  });

  it('saving with no changes sends nothing', async () => {
    const { user } = await openAdmin();
    await queue();
    await user.click(screen.getByRole('button', { name: 'Sunday pastry walk' }));
    await user.click(screen.getByRole('button', { name: 'Save changes' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(writes()).toEqual([]);
  });

  it('edit validates with the shared schema and shows a failed save inside the panel', async () => {
    const { user } = await openAdmin();
    await queue();
    await user.click(screen.getByRole('button', { name: 'Sunday pastry walk' }));
    const panel = screen.getByRole('dialog', { name: 'Edit idea' });

    await user.clear(within(panel).getByLabelText('Title'));
    await user.type(within(panel).getByLabelText('Title'), 'ab');
    await user.click(within(panel).getByRole('button', { name: 'Save changes' }));
    expect(await within(panel).findByText('Use at least 3 characters.')).toBeInTheDocument();
    expect(within(panel).getByLabelText('Title')).toHaveAccessibleDescription(
      /Use at least 3 characters./,
    );
    expect(writes()).toEqual([]);

    server.use(
      http.patch('*/api/v1/admin/ideas/:id', () =>
        HttpResponse.json(
          { error: { code: 'INTERNAL', message: 'Something went wrong. Try again.' } },
          { status: 500 },
        ),
      ),
    );
    await user.type(within(panel).getByLabelText('Title'), 'c walk');
    await user.click(within(panel).getByRole('button', { name: 'Save changes' }));
    expect(await within(panel).findByRole('alert')).toHaveTextContent(
      'Something went wrong. Try again.',
    );
    // The panel stays open, and nothing went to the toast.
    expect(screen.getByRole('dialog', { name: 'Edit idea' })).toBeInTheDocument();
    expect(document.querySelector('[data-toast-viewport]')).not.toHaveTextContent(
      'Something went wrong',
    );
  });

  it('delete asks first and removes the row from every list', async () => {
    const { user } = await openAdmin();
    await queue();
    await user.click(screen.getByRole('button', { name: 'Sunday pastry walk' }));
    await user.click(screen.getByRole('button', { name: 'Delete idea' }));

    const confirm = screen.getByRole('alertdialog', { name: 'Delete "Sunday pastry walk"?' });
    expect(within(confirm).getByRole('button', { name: 'Cancel' })).toHaveFocus();
    await user.click(within(confirm).getByRole('button', { name: 'Delete idea' }));

    expect(await screen.findByText('Idea deleted')).toBeInTheDocument();
    expect(writes()).toEqual([
      expect.objectContaining({ method: 'DELETE', path: `/api/v1/admin/ideas/${PASTRY}` }),
    ]);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Sunday pastry walk' })).not.toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Pending 2' })).toBeInTheDocument();
    expect(ideaStore.find(PASTRY)).toBeUndefined();
    expect(within(rowOf(BOOKSHOP_TITLE)).getByRole('button', { name: 'Approve' })).toHaveFocus();

    // Not in All ideas either.
    await user.click(screen.getByRole('tab', { name: 'All ideas' }));
    await user.click(await screen.findByRole('radio', { name: 'Pending review' }));
    await screen.findByRole('button', { name: BOOKSHOP_TITLE });
    expect(screen.queryByRole('button', { name: 'Sunday pastry walk' })).not.toBeInTheDocument();
  });

  it('all ideas filters by status and q', async () => {
    const { user, router } = await openAdmin();
    await queue();
    await user.click(screen.getByRole('tab', { name: 'All ideas' }));
    expect(router.state.location.hash).toBe('#all');

    const table = await screen.findByRole('table', { name: 'Ideas by status' });
    expect(screen.getByRole('radio', { name: 'Approved' })).toBeChecked();
    // Approved titles link to the idea.
    expect(within(table).getByRole('link', { name: 'Salsa social night' })).toHaveAttribute(
      'href',
      '/ideas/64b000000000000000000001',
    );
    expect(within(rowOf('Salsa social night')).getByText('No ratings yet')).toBeInTheDocument();
    expect(within(rowOf('Salsa social night')).getByText('Nov 24, 2026')).toBeInTheDocument();
    expect(screen.getByText('Showing 12 of 12 approved ideas')).toBeInTheDocument();

    await user.click(screen.getByRole('radio', { name: 'Not approved' }));
    expect(
      await screen.findByRole('button', { name: 'Sushi boat eating contest' }),
    ).toBeInTheDocument();
    expect(within(rowOf('Sushi boat eating contest')).getByText('Not public')).toBeInTheDocument();
    expect(seen.at(-1)?.search.get('status')).toBe('rejected');

    await user.click(screen.getByRole('radio', { name: 'Approved' }));
    await user.type(screen.getByLabelText('Search titles'), 'dumpling');
    await waitFor(() => expect(seen.at(-1)?.search.get('q')).toBe('dumpling'));
    expect(seen.at(-1)?.search.get('status')).toBe('approved');
    expect(
      await screen.findByText('Showing 1 of 1 approved idea matching "dumpling"'),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Dumpling crawl' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Salsa social night' })).not.toBeInTheDocument();
    // Debounced: one request for the whole word, not one per letter.
    expect(seen.filter((s) => s.search.get('q')?.startsWith('d'))).toHaveLength(1);

    await user.clear(screen.getByLabelText('Search titles'));
    await user.type(screen.getByLabelText('Search titles'), 'zzz');
    expect(
      await screen.findByRole('heading', { name: 'No ideas match "zzz".' }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Clear search' }));
    expect(screen.getByLabelText('Search titles')).toHaveValue('');
    expect(screen.getByLabelText('Search titles')).toHaveFocus();
    expect(await screen.findByText('Showing 12 of 12 approved ideas')).toBeInTheDocument();
  });

  it('empty queue copy', async () => {
    ideaStore.set(ideaStore.all().filter((i) => i.status !== 'pending'));
    const { user } = await openAdmin();
    expect(
      await screen.findByRole('heading', { name: 'Nothing to review. Nice work.' }),
    ).toBeInTheDocument();
    expect(
      screen.getByText('New ideas show up here as soon as someone shares one.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Pending 0' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /waiting for review/ })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'See all ideas' }));
    expect(screen.getByRole('tab', { name: 'All ideas' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: 'All ideas' })).toHaveFocus();
    expect(await screen.findByRole('radio', { name: 'Approved' })).toBeChecked();
  });

  it('the last row leaving the queue moves focus to "See all ideas"', async () => {
    ideaStore.set(ideaStore.all().filter((i) => i.status !== 'pending' || i.id === PASTRY));
    const { user } = await openAdmin();
    await queue();
    await user.click(screen.getByRole('button', { name: 'Approve' }));
    expect(await screen.findByRole('button', { name: 'See all ideas' })).toHaveFocus();
  });

  it('500 shows error with Try again', async () => {
    let fail = true;
    server.use(
      http.get('*/api/v1/admin/ideas', () =>
        fail
          ? HttpResponse.json({ error: { code: 'INTERNAL', message: 'Boom' } }, { status: 500 })
          : undefined,
      ),
    );
    const { user } = await openAdmin();
    // The toast's alert region is always there, so find the heading and check its container.
    const heading = await screen.findByRole('heading', { name: "We couldn't load the queue." });
    const alert = heading.closest<HTMLElement>('[role="alert"]');
    if (!alert) throw new Error('The queue error is not in an alert');
    expect(within(alert).getByText('Check your connection and try again.')).toBeInTheDocument();
    fail = false;
    await user.click(within(alert).getByRole('button', { name: 'Try again' }));
    expect(await queue()).toBeInTheDocument();
  });

  it('shows the loading state while the queue loads', async () => {
    server.use(
      http.get('*/api/v1/admin/ideas', async () => {
        await new Promise((r) => setTimeout(r, 50));
        return undefined;
      }),
    );
    await openAdmin();
    expect(screen.getByText('Loading ideas waiting for review…')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Ideas waiting for review' })).toBeInTheDocument();
    await queue();
  });

  it('axe on each tab and on the open panel', async () => {
    const { user } = await openAdmin();
    await queue();
    await expectNoAxeViolations(document.body);

    await user.click(screen.getByRole('button', { name: 'Sunday pastry walk' }));
    await screen.findByRole('dialog', { name: 'Edit idea' });
    await expectNoAxeViolations(document.body);
    await user.click(screen.getByRole('button', { name: 'Delete idea' }));
    await expectNoAxeViolations(document.body);
    await user.keyboard('{Escape}');
    await user.keyboard('{Escape}');

    await user.click(screen.getByRole('tab', { name: 'All ideas' }));
    await screen.findByRole('table', { name: 'Ideas by status' });
    await expectNoAxeViolations(document.body);
  });
});
