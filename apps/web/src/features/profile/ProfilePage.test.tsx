import { screen, waitFor, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it } from 'vitest';
import { expectNoAxeViolations } from '../../test/axe';
import { ideaFixtures } from '../../test/fixtures/ideas';
import { authStore } from '../../test/msw/handlers';
import { ideaStore } from '../../test/msw/ideas-handlers';
import { server } from '../../test/msw/server';
import { renderApp } from '../../test/render';

function login(name = 'Maya Chen', email = 'maya.chen@example.com') {
  authStore.addUser({ name, email, password: 'password1' });
  authStore.loginAs(email);
}

function cardOf(title: string): HTMLElement {
  const heading = screen.getByRole('heading', { level: 3, name: title });
  return heading.closest('article') as HTMLElement;
}

const mayaApproved = ideaFixtures.find(
  (i) => i.creator.name === 'Maya Chen' && i.status === 'approved',
)!;

describe('Profile', () => {
  beforeEach(() => login());

  it('lists my ideas with the three statuses; only approved links', async () => {
    renderApp('/profile');
    expect(await screen.findByRole('heading', { level: 1, name: 'Maya Chen' })).toBeInTheDocument();
    expect(
      screen.getByText(
        (_, el) => el?.tagName === 'P' && el.textContent === 'maya.chen@example.com',
      ),
    ).toBeInTheDocument();
    await screen.findByRole('heading', { level: 3, name: 'Sunday pastry walk' });
    expect(screen.getByRole('heading', { level: 2, name: /Your ideas/ })).toBeInTheDocument();

    const pending = cardOf('Sunday pastry walk');
    expect(within(pending).getByText('Pending review')).toBeInTheDocument();
    expect(within(pending).getByText('Waiting for review')).toBeInTheDocument();
    expect(within(pending).queryByRole('link')).not.toBeInTheDocument();
    expect(within(pending).getByText('Food')).toBeInTheDocument();
    expect(within(pending).getByText('Adventure')).toBeInTheDocument();

    const rejected = cardOf('Sushi boat eating contest');
    expect(within(rejected).getByText('Not approved')).toBeInTheDocument();
    expect(within(rejected).getByText('Not approved this time')).toBeInTheDocument();
    expect(within(rejected).queryByRole('link', { name: 'Sushi boat eating contest' })).toBeNull();
    expect(
      within(rejected).getByRole('link', {
        name: 'Share it again with changes',
        description: 'Sushi boat eating contest',
      }),
    ).toHaveAttribute('href', '/share');

    const approved = cardOf(mayaApproved.title);
    expect(within(approved).getByText('Approved')).toBeInTheDocument();
    expect(
      within(approved).getByText(`Live · ${mayaApproved.saveCount} saves`),
    ).toBeInTheDocument();
    expect(within(approved).getByRole('link', { name: mayaApproved.title })).toHaveAttribute(
      'href',
      `/ideas/${mayaApproved.id}`,
    );
  });

  it('says 1 save in the singular', async () => {
    ideaStore.set(
      ideaFixtures.map((i) => (i.id === mayaApproved.id ? { ...i, saveCount: 1 } : { ...i })),
    );
    renderApp('/profile');
    expect(await screen.findByText('Live · 1 save')).toBeInTheDocument();
  });

  it('shows a loading status while ideas load', async () => {
    renderApp('/profile');
    expect(await screen.findByText('Loading your ideas…')).toBeInTheDocument();
    await screen.findByRole('heading', { level: 3, name: 'Sunday pastry walk' });
    expect(screen.queryByText('Loading your ideas…')).not.toBeInTheDocument();
  });

  it('empty state', async () => {
    ideaStore.set([]);
    const { user, router } = renderApp('/profile');
    expect(await screen.findByText("You haven't shared an idea yet.")).toBeInTheDocument();
    await user.click(within(screen.getByRole('main')).getByRole('link', { name: 'Share an idea' }));
    await waitFor(() => expect(router.state.location.pathname).toBe('/share'));
  });

  it('error state retries', async () => {
    server.use(
      http.get(
        '*/api/v1/me/ideas',
        () => HttpResponse.json({ error: { code: 'X', message: 'no' } }, { status: 500 }),
        { once: true },
      ),
    );
    const { user } = renderApp('/profile');
    expect(
      (await screen.findByText("We couldn't load your ideas.")).closest('[role="alert"]'),
    ).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Try again' }));
    expect(
      await screen.findByRole('heading', { level: 3, name: 'Sunday pastry walk' }),
    ).toBeInTheDocument();
  });

  it('shows Show more when there is another page', async () => {
    const base = ideaFixtures.find((i) => i.status === 'pending')!;
    server.use(
      http.get('*/api/v1/me/ideas', ({ request }) => {
        const page = Number(new URL(request.url).searchParams.get('page') ?? 1);
        return HttpResponse.json({
          items: [{ ...base, id: `64b00000000000000000099${page}`, title: `Page ${page} idea` }],
          page,
          pageSize: 1,
          total: 2,
        });
      }),
    );
    const { user } = renderApp('/profile');
    await screen.findByRole('heading', { level: 3, name: 'Page 1 idea' });
    await user.click(screen.getByRole('button', { name: 'Show more' }));
    expect(
      await screen.findByRole('heading', { level: 3, name: 'Page 2 idea' }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Show more' })).not.toBeInTheDocument();
  });

  it('logged out goes to login', async () => {
    authStore.logout();
    const { router } = renderApp('/profile');
    await waitFor(() => expect(router.state.location.pathname).toBe('/login'));
    expect(router.state.location.search).toContain('next=%2Fprofile');
  });

  it('has no axe violations', async () => {
    const { container } = renderApp('/profile');
    await screen.findByRole('heading', { level: 3, name: 'Sunday pastry walk' });
    await expectNoAxeViolations(container);
  });
});

describe('Profile with a 50-character name', () => {
  it('wraps the name and breaks the email at the @ and dots', async () => {
    login(
      'Maria Fernanda Castellanos-Villalobos y de la Cruz',
      'mariafernanda.castellanos@example.com',
    );
    const { container } = renderApp('/profile');
    const h1 = await screen.findByRole('heading', {
      level: 1,
      name: 'Maria Fernanda Castellanos-Villalobos y de la Cruz',
    });
    expect(h1.className).toContain('[overflow-wrap:anywhere]');
    expect(h1.className).not.toContain('truncate');
    expect(container.querySelectorAll('wbr').length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText('@example.com')).toHaveClass('whitespace-nowrap');
    await screen.findByRole('heading', { level: 2, name: /Your ideas/ });
  });
});
