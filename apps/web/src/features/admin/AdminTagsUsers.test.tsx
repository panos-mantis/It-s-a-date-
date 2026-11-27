import { screen, waitFor, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { expectNoAxeViolations } from '../../test/axe';
import { authStore } from '../../test/msw/handlers';
import { tagStore, userStore } from '../../test/msw/ideas-handlers';
import { server } from '../../test/msw/server';
import { createTestQueryClient, renderApp } from '../../test/render';

const PANOS = '64c000000000000000000002';
const MAYA = '64c000000000000000000001';

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
const invalidatedKeys = (spy: { mock: { calls: unknown[][] } }) =>
  spy.mock.calls.map(([filters]) => (filters as { queryKey?: unknown }).queryKey);
const writes = () => seen.filter((s) => s.method !== 'GET');

beforeEach(() => {
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
});

async function openTags() {
  const view = renderApp('/admin#tags');
  const table = await screen.findByRole('table', { name: 'Tags, A to Z' });
  return { ...view, table };
}

async function openUsers() {
  const view = renderApp('/admin#users');
  const table = await screen.findByRole('table', { name: 'Users, newest first' });
  return { ...view, table };
}

const tagRow = (name: string) => screen.getByText(name, { selector: 'span' }).closest('tr')!;
const userRow = (name: string) =>
  within(screen.getByRole('table', { name: 'Users, newest first' }))
    .getByText(name, { selector: 'span' })
    .closest('tr')!;
const renameForm = (tag: string) => screen.getByRole('form', { name: `Rename ${tag}` });

describe('Admin Tags', () => {
  it('lists the tags A to Z with slug and icon, and says how many', async () => {
    const { table } = await openTags();
    expect(screen.getByRole('tab', { name: 'Tags' })).toHaveAttribute('aria-selected', 'true');
    const rows = within(table).getAllByRole('row').slice(1);
    expect(rows).toHaveLength(8);
    expect(within(rows[0]!).getByText('Adventure')).toBeInTheDocument();
    const games = tagRow('Board games');
    expect(within(games).getByText('board-game')).toBeInTheDocument();
    expect(within(games).getByText('dice-5')).toBeInTheDocument();
    expect(screen.getByText('8 tags')).toBeInTheDocument();
  });

  it('add with icon refreshes the category row data', async () => {
    const { user, queryClient } = await openTags();
    const spy = vi.spyOn(queryClient, 'invalidateQueries');
    const form = screen.getByRole('form', { name: 'Add a tag' });
    // Sparkles to start; the slug previews as you type.
    expect(within(form).getByRole('radio', { name: 'sparkles' })).toBeChecked();
    expect(within(form).getByText('picnics', { selector: 'code' })).toBeInTheDocument();
    await user.type(within(form).getByLabelText('Name'), 'Café picnics!');
    expect(within(form).getByText('cafe-picnics', { selector: 'code' })).toBeInTheDocument();
    await user.click(within(form).getByRole('radio', { name: 'wine' }));
    await user.click(within(form).getByRole('button', { name: 'Add tag' }));

    expect(await screen.findByText('Tag added: Café picnics!')).toBeInTheDocument();
    expect(writes()).toEqual([
      expect.objectContaining({
        method: 'POST',
        path: '/api/v1/admin/tags',
        body: { name: 'Café picnics!', icon: 'wine' },
      }),
    ]);
    const keys = invalidatedKeys(spy);
    expect(keys).toContainEqual(['tags']);
    expect(keys).toContainEqual(['ideas']);
    expect(await screen.findByText('9 tags')).toBeInTheDocument();
    expect(within(tagRow('Café picnics!')).getByText('cafe-picnics')).toBeInTheDocument();
    // The form starts over, with focus ready for the next tag.
    expect(within(form).getByLabelText('Name')).toHaveValue('');
    expect(within(form).getByRole('radio', { name: 'sparkles' })).toBeChecked();
    expect(within(form).getByLabelText('Name')).toHaveFocus();
  });

  it('duplicate name shows the API message', async () => {
    const { user } = await openTags();
    const form = screen.getByRole('form', { name: 'Add a tag' });
    const name = within(form).getByLabelText('Name');
    await user.type(name, 'Self care');
    await user.click(within(form).getByRole('button', { name: 'Add tag' }));
    await within(form).findByText('A tag with this name already exists');
    expect(name).toHaveAccessibleDescription(/A tag with this name already exists/);
    expect(name).toBeInvalid();
    expect(name).toHaveValue('Self care');
    expect(name).toHaveFocus();
    // Typing again clears it.
    await user.type(name, 's');
    expect(within(form).queryByText('A tag with this name already exists')).not.toBeInTheDocument();
  });

  it('checks the name length before asking, and shows the API message for a name with no slug', async () => {
    const { user } = await openTags();
    const form = screen.getByRole('form', { name: 'Add a tag' });
    const name = within(form).getByLabelText('Name');
    await user.type(name, 'a');
    await user.click(within(form).getByRole('button', { name: 'Add tag' }));
    expect(await within(form).findByText('Use 2 to 30 characters.')).toBeInTheDocument();
    expect(writes()).toEqual([]);
    await user.clear(name);
    await user.type(name, '!!');
    await user.click(within(form).getByRole('button', { name: 'Add tag' }));
    expect(await within(form).findByText('Use at least one letter or number')).toBeInTheDocument();
    expect(name).toHaveFocus();
  });

  it('rename cancel restores', async () => {
    const { user } = await openTags();
    await user.click(within(tagRow('Food')).getByRole('button', { name: 'Rename' }));
    const form = renameForm('Food');
    const input = screen.getByLabelText('New name');
    expect(input).toHaveValue('Food');
    expect(input).toHaveFocus();
    expect(within(form).getByRole('radio', { name: 'utensils' })).toBeChecked();
    await user.clear(input);
    await user.type(input, 'Dinner');
    await user.click(within(form).getByRole('radio', { name: 'coffee' }));
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByLabelText('New name')).not.toBeInTheDocument();
    const restored = tagRow('Food');
    expect(within(restored).getByText('utensils')).toBeInTheDocument();
    expect(within(restored).getByRole('button', { name: 'Rename' })).toHaveFocus();
    expect(writes()).toEqual([]);
  });

  it('Escape restores the row and nothing else', async () => {
    const { user } = await openTags();
    await user.click(within(tagRow('Food')).getByRole('button', { name: 'Rename' }));
    await user.keyboard('{Escape}');
    expect(screen.queryByLabelText('New name')).not.toBeInTheDocument();
    expect(within(tagRow('Food')).getByRole('button', { name: 'Rename' })).toHaveFocus();
    // The tab and the page are still there.
    expect(screen.getByRole('tab', { name: 'Tags' })).toHaveAttribute('aria-selected', 'true');
  });

  it('rename saves the name and icon, and a taken name shows the API message', async () => {
    const { user } = await openTags();
    await user.click(within(tagRow('Food')).getByRole('button', { name: 'Rename' }));
    const input = screen.getByLabelText('New name');
    await user.clear(input);
    await user.type(input, 'Self care');
    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(await screen.findByText('A tag with this name already exists')).toBeInTheDocument();
    expect(input).toHaveFocus();

    await user.clear(input);
    await user.type(input, 'Dinner');
    await user.click(within(renameForm('Food')).getByRole('radio', { name: 'wine' }));
    await user.keyboard('{Enter}');
    expect(await screen.findByText('Tag renamed to Dinner')).toBeInTheDocument();
    expect(writes().at(-1)).toEqual(
      expect.objectContaining({
        method: 'PATCH',
        path: '/api/v1/admin/tags/64a000000000000000000001',
        body: { name: 'Dinner', icon: 'wine' },
      }),
    );
    const row = tagRow('Dinner');
    expect(within(row).getByText('dinner')).toBeInTheDocument();
    expect(within(row).getByText('wine')).toBeInTheDocument();
    expect(within(row).getByRole('button', { name: 'Rename' })).toHaveFocus();
  });

  it('a renamed tag shows its new name on the Pending rows and refreshes Profile ideas', async () => {
    const queryClient = createTestQueryClient();
    queryClient.setDefaultOptions({
      queries: { retry: false, gcTime: Infinity, staleTime: 30_000 },
    });
    const { user } = renderApp('/admin', { queryClient });
    const queue = await screen.findByRole('table', {
      name: 'Ideas waiting for review, oldest first',
    });
    expect(within(queue).getAllByText('Food').length).toBeGreaterThan(0);
    const spy = vi.spyOn(queryClient, 'invalidateQueries');

    await user.click(screen.getByRole('tab', { name: 'Tags' }));
    await screen.findByRole('table', { name: 'Tags, A to Z' });
    await user.click(within(tagRow('Food')).getByRole('button', { name: 'Rename' }));
    const input = screen.getByLabelText('New name');
    await user.clear(input);
    await user.type(input, 'Dinner');
    await user.keyboard('{Enter}');
    await screen.findByText('Tag renamed to Dinner');

    expect(invalidatedKeys(spy)).toContainEqual(['me', 'ideas']);
    await user.click(screen.getByRole('tab', { name: /^Pending/ }));
    const again = await screen.findByRole('table', {
      name: 'Ideas waiting for review, oldest first',
    });
    expect((await within(again).findAllByText('Dinner')).length).toBeGreaterThan(0);
    expect(within(again).queryByText('Food')).not.toBeInTheDocument();
  });

  it('delete asks first', async () => {
    const { user, queryClient } = await openTags();
    const spy = vi.spyOn(queryClient, 'invalidateQueries');
    const row = tagRow('Board games');
    await user.click(within(row).getByRole('button', { name: 'Delete' }));
    const dialog = await screen.findByRole('alertdialog', { name: 'Delete "Board games"?' });
    expect(dialog).toHaveAccessibleDescription(
      'It comes off every idea that has it, and the Board games button leaves Home. An idea tagged only Board games is left with no tag until someone edits it. This can’t be undone.',
    );
    expect(within(dialog).getByRole('button', { name: 'Cancel' })).toHaveFocus();
    expect(writes()).toEqual([]);

    await user.click(within(dialog).getByRole('button', { name: 'Cancel' }));
    expect(writes()).toEqual([]);
    expect(within(tagRow('Board games')).getByRole('button', { name: 'Delete' })).toHaveFocus();

    await user.click(within(tagRow('Board games')).getByRole('button', { name: 'Delete' }));
    await user.click(await screen.findByRole('button', { name: 'Delete tag' }));
    expect(await screen.findByText('Tag deleted')).toBeInTheDocument();
    expect(writes()).toEqual([
      expect.objectContaining({
        method: 'DELETE',
        path: '/api/v1/admin/tags/64a000000000000000000005',
      }),
    ]);
    const keys = invalidatedKeys(spy);
    expect(keys).toContainEqual(['tags']);
    expect(keys).toContainEqual(['ideas']);
    await waitFor(() => expect(screen.queryByText('Board games')).not.toBeInTheDocument());
    // Focus lands on the next row's Rename (Dancing).
    expect(within(tagRow('Dancing')).getByRole('button', { name: 'Rename' })).toHaveFocus();
  });

  it('no tags yet shows an empty state', async () => {
    tagStore.set([]);
    renderApp('/admin#tags');
    expect(await screen.findByText('No tags yet.')).toBeInTheDocument();
  });

  it('a failed load shows a retry', async () => {
    server.use(http.get('*/api/v1/tags', () => HttpResponse.error()));
    renderApp('/admin#tags');
    expect(await screen.findByText("We couldn't load the tags.")).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
  });

  it('has no axe violations', async () => {
    await openTags();
    await expectNoAxeViolations(document.body);
  });
});

describe('Admin Users', () => {
  it('lists people with role chips, marks you, and counts admins', async () => {
    const { table } = await openUsers();
    expect(screen.getByRole('tab', { name: 'Users' })).toHaveAttribute('aria-selected', 'true');
    expect(within(table).getAllByRole('row')).toHaveLength(9);
    const panos = userRow('Panos');
    expect(within(panos).getByText('(you)')).toBeInTheDocument();
    expect(within(panos).getByText('Admin')).toBeInTheDocument();
    expect(within(panos).getByRole('button', { name: 'Remove admin' })).toBeInTheDocument();
    const maya = userRow('Maya Chen');
    expect(within(maya).getByText('User')).toBeInTheDocument();
    expect(within(maya).getByRole('button', { name: 'Make admin' })).toBeInTheDocument();
    expect(
      screen.getByText('8 users, 1 admin. Admins can review ideas and manage tags and users.'),
    ).toBeInTheDocument();
  });

  it('search sends q', async () => {
    const { user } = await openUsers();
    await user.type(screen.getByLabelText('Search by name or email'), 'priya');
    await waitFor(() => {
      expect(
        seen.some((s) => s.path === '/api/v1/admin/users' && s.search.get('q') === 'priya'),
      ).toBe(true);
    });
    await waitFor(() => expect(screen.queryByText('Maya Chen')).not.toBeInTheDocument());
    expect(screen.getByText('Priya Natarajan')).toBeInTheDocument();
    expect(await screen.findByText('1 user matches "priya"')).toBeInTheDocument();

    await user.clear(screen.getByLabelText('Search by name or email'));
    await user.type(screen.getByLabelText('Search by name or email'), 'zzz');
    expect(await screen.findByText('No people match "zzz".')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Clear search' }));
    expect(await screen.findByText('Maya Chen')).toBeInTheDocument();
  });

  it('make admin asks first and updates the chip', async () => {
    const { user } = await openUsers();
    await user.click(within(userRow('Maya Chen')).getByRole('button', { name: 'Make admin' }));
    const dialog = await screen.findByRole('alertdialog', { name: 'Make Maya Chen an admin?' });
    expect(within(dialog).getByRole('button', { name: 'Cancel' })).toHaveFocus();
    expect(writes()).toEqual([]);
    await user.click(within(dialog).getByRole('button', { name: 'Make admin' }));

    expect(await screen.findByText('Maya Chen is now an admin.')).toBeInTheDocument();
    expect(writes()).toEqual([
      expect.objectContaining({
        method: 'POST',
        path: `/api/v1/admin/users/${MAYA}/role`,
        body: { role: 'admin' },
      }),
    ]);
    await waitFor(() =>
      expect(within(userRow('Maya Chen')).getByText('Admin')).toBeInTheDocument(),
    );
    const button = within(userRow('Maya Chen')).getByRole('button', { name: 'Remove admin' });
    expect(button).toHaveFocus();
    expect(
      screen.getByText('8 users, 2 admins. Admins can review ideas and manage tags and users.'),
    ).toBeInTheDocument();
  });

  it('removing someone else asks with their name', async () => {
    userStore.set(userStore.all().map((u) => (u.id === MAYA ? { ...u, role: 'admin' } : u)));
    const { user } = await openUsers();
    await user.click(within(userRow('Maya Chen')).getByRole('button', { name: 'Remove admin' }));
    const dialog = await screen.findByRole('alertdialog', { name: 'Remove admin from Maya Chen?' });
    expect(dialog).toHaveAccessibleDescription(
      'Maya Chen keeps their account and ideas but loses this page.',
    );
    await user.click(within(dialog).getByRole('button', { name: 'Remove admin' }));
    expect(await screen.findByText('Admin removed from Maya Chen.')).toBeInTheDocument();
    await waitFor(() => expect(within(userRow('Maya Chen')).getByText('User')).toBeInTheDocument());
  });

  it('last admin 409 keeps the role and shows the message', async () => {
    const { user } = await openUsers();
    const button = within(userRow('Panos')).getByRole('button', { name: 'Remove admin' });
    await user.click(button);
    const dialog = await screen.findByRole('alertdialog', {
      name: 'Remove your own admin access?',
    });
    expect(dialog).toHaveAccessibleDescription(
      'You’ll lose this page as soon as it’s done, and only another admin can give it back.',
    );
    await user.click(within(dialog).getByRole('button', { name: 'Remove admin' }));

    const alert = await screen.findByText("You can't remove the last admin.");
    expect(alert.closest('[role="alert"]')).toHaveTextContent(
      "You can't remove the last admin. Make someone else an admin first, then try again.",
    );
    await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument());
    expect(within(userRow('Panos')).getByText('Admin')).toBeInTheDocument();
    expect(within(userRow('Panos')).getByRole('button', { name: 'Remove admin' })).toHaveFocus();
    expect(authStore.sessionUser()?.role).toBe('admin');

    // The message clears with the next search.
    await user.type(screen.getByLabelText('Search by name or email'), 'm');
    expect(screen.queryByText("You can't remove the last admin.")).not.toBeInTheDocument();
  });

  it('demoting yourself with another admin around shows the non-admin page, no crash', async () => {
    userStore.set(userStore.all().map((u) => (u.id === MAYA ? { ...u, role: 'admin' } : u)));
    const { user } = await openUsers();
    await user.click(within(userRow('Panos')).getByRole('button', { name: 'Remove admin' }));
    await user.click(
      within(await screen.findByRole('alertdialog')).getByRole('button', { name: 'Remove admin' }),
    );
    expect(await screen.findByText('This page is for admins.')).toBeInTheDocument();
    expect(writes()).toEqual([
      expect.objectContaining({
        path: `/api/v1/admin/users/${PANOS}/role`,
        body: { role: 'user' },
      }),
    ]);
  });

  it('demoting yourself drops the cached admin data and never refetches it', async () => {
    userStore.set(userStore.all().map((u) => (u.id === MAYA ? { ...u, role: 'admin' } : u)));
    const { user, queryClient } = await openUsers();
    await user.click(within(userRow('Panos')).getByRole('button', { name: 'Remove admin' }));
    await user.click(
      within(await screen.findByRole('alertdialog')).getByRole('button', { name: 'Remove admin' }),
    );
    expect(await screen.findByText('This page is for admins.')).toBeInTheDocument();
    await waitFor(() =>
      expect(
        queryClient
          .getQueryCache()
          .findAll({ queryKey: ['admin'] })
          .filter((q) => q.state.data !== undefined),
      ).toEqual([]),
    );
    // Only the first load: no refetch after the demotion would have been a 403.
    expect(seen.filter((s) => s.method === 'GET' && s.path.endsWith('/admin/users'))).toHaveLength(
      1,
    );
  });

  it('Show more failing keeps the people and says so in a toast', async () => {
    server.use(
      http.get('*/api/v1/admin/users', ({ request }) => {
        const page = Number(new URL(request.url).searchParams.get('page') ?? 1);
        if (page > 1) {
          return HttpResponse.json({ error: { code: 'X', message: 'no' } }, { status: 500 });
        }
        return HttpResponse.json({
          items: userStore.all().slice(0, 1),
          page,
          pageSize: 1,
          total: 2,
        });
      }),
    );
    const { user } = await openUsers();
    await user.click(screen.getByRole('button', { name: 'Show more' }));
    expect(
      await screen.findByText("We couldn't load more people. Check your connection and try again."),
    ).toBeInTheDocument();
    expect(within(screen.getByRole('table')).getAllByRole('row')).toHaveLength(2);
  });

  it('a failed load shows a retry', async () => {
    server.use(http.get('*/api/v1/admin/users', () => HttpResponse.error()));
    renderApp('/admin#users');
    expect(await screen.findByText("We couldn't load the people.")).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
  });

  it('has no axe violations', async () => {
    await openUsers();
    await expectNoAxeViolations(document.body);
  });
});
