import { screen, waitFor, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { NETWORK_MESSAGE } from '../../lib/api';
import { authStore } from '../../test/msw/handlers';
import { server } from '../../test/msw/server';
import { expectNoAxeViolations } from '../../test/axe';
import { renderApp } from '../../test/render';

const addAna = () => authStore.addUser({ name: 'Ana', email: 'ana@x.com', password: 'password1' });

describe('LoginPage', () => {
  it('logs in and goes to next', async () => {
    addAna();
    const { user } = renderApp('/login?next=%2Fshare');
    await user.type(await screen.findByLabelText('Email'), 'ana@x.com');
    await user.type(screen.getByLabelText('Password'), 'password1');
    await user.click(screen.getByRole('button', { name: 'Log in' }));
    await screen.findByText('Welcome back, Ana.');
    expect(await screen.findByRole('heading', { name: 'Share an idea' })).toBeVisible();
    expect(await screen.findByText('Welcome back, Ana.')).toBeVisible();
  });

  it('normalises the email it sends', async () => {
    addAna();
    let sent: string | undefined;
    server.use(
      http.post('*/api/v1/auth/login', async ({ request }) => {
        sent = ((await request.json()) as { email: string }).email;
        return HttpResponse.json({ id: 'u1', name: 'Ana', email: 'ana@x.com', role: 'user' });
      }),
    );
    const { user } = renderApp('/login');
    await user.type(await screen.findByLabelText('Email'), '  Ana@X.com ');
    await user.type(screen.getByLabelText('Password'), 'password1');
    await user.click(screen.getByRole('button', { name: 'Log in' }));
    await waitFor(() => expect(sent).toBe('ana@x.com'));
  });

  it('shows the wrong-password message', async () => {
    addAna();
    const { user } = renderApp('/login');
    await user.type(await screen.findByLabelText('Email'), 'ana@x.com');
    await user.type(screen.getByLabelText('Password'), 'nope-nope');
    await user.click(screen.getByRole('button', { name: 'Log in' }));
    expect(await screen.findByText('Email or password is wrong')).toHaveAttribute('role', 'alert');
    expect(screen.getByLabelText('Password')).toHaveFocus();
  });

  it('shows field errors before sending', async () => {
    let calls = 0;
    server.use(
      http.post('*/api/v1/auth/login', () => {
        calls += 1;
        return HttpResponse.json({});
      }),
    );
    const { user } = renderApp('/login');
    await user.click(await screen.findByRole('button', { name: 'Log in' }));
    expect(await screen.findByText('Enter your email.')).toBeVisible();
    expect(screen.getByText('Enter your password.')).toBeVisible();
    expect(calls).toBe(0);
  });

  it('shows the network message', async () => {
    server.use(http.post('*/api/v1/auth/login', () => HttpResponse.error()));
    const { user } = renderApp('/login');
    await user.type(await screen.findByLabelText('Email'), 'ana@x.com');
    await user.type(screen.getByLabelText('Password'), 'password1');
    await user.click(screen.getByRole('button', { name: 'Log in' }));
    expect(await screen.findByText(NETWORK_MESSAGE)).toHaveAttribute('role', 'alert');
  });

  it('sends one request on double submit', async () => {
    addAna();
    let calls = 0;
    server.use(
      http.post('*/api/v1/auth/login', async () => {
        calls += 1;
        await new Promise((r) => setTimeout(r, 50));
        return HttpResponse.json({ id: 'u1', name: 'Ana', email: 'ana@x.com', role: 'user' });
      }),
    );
    const { user } = renderApp('/login');
    await user.type(await screen.findByLabelText('Email'), 'ana@x.com');
    await user.type(screen.getByLabelText('Password'), 'password1');
    const button = screen.getByRole('button', { name: 'Log in' });
    await user.dblClick(button);
    expect(button).toHaveAttribute('aria-busy', 'true');
    await screen.findByText('Welcome back, Ana.');
    expect(calls).toBe(1);
  });

  it('ignores an unsafe next', async () => {
    addAna();
    const { user, router } = renderApp('/login?next=%2F%2Fevil.com');
    await user.type(await screen.findByLabelText('Email'), 'ana@x.com');
    await user.type(screen.getByLabelText('Password'), 'password1');
    await user.click(screen.getByRole('button', { name: 'Log in' }));
    await screen.findByText('Welcome back, Ana.');
    expect(router.state.location.pathname).toBe('/');
    expect(router.state.location.search).toBe('');
  });

  it('keeps next on the sign up link', async () => {
    renderApp('/login?next=%2Fshare');
    await screen.findByRole('heading', { name: 'Welcome back' });
    expect(
      within(screen.getByRole('main')).getByRole('link', { name: 'Create an account' }),
    ).toHaveAttribute('href', '/signup?next=%2Fshare');
  });

  it('keeps the reason on the sign up link and shows its hint', async () => {
    renderApp('/login?next=%2Fideas%2F5&reason=rate');
    expect(await screen.findByText('Log in to rate this idea.')).toBeVisible();
    expect(
      within(screen.getByRole('main')).getByRole('link', { name: 'Create an account' }),
    ).toHaveAttribute('href', '/signup?next=%2Fideas%2F5&reason=rate');
  });

  it('shows no hint without a known next', async () => {
    renderApp('/login');
    await screen.findByRole('heading', { name: 'Welcome back' });
    expect(
      screen.queryByText(/^Log in to (share|see|save ideas you|rate)/),
    ).not.toBeInTheDocument();
  });

  it('shows the sub-line', async () => {
    renderApp('/login');
    expect(
      await screen.findByText('Log in to save ideas, rate them and share your own.'),
    ).toBeVisible();
  });

  it('show password toggles the field type', async () => {
    const { user } = renderApp('/login');
    const password = await screen.findByLabelText('Password');
    expect(password).toHaveAttribute('type', 'password');
    await user.click(screen.getByRole('button', { name: 'Show' }));
    expect(password).toHaveAttribute('type', 'text');
    expect(screen.getByRole('button', { name: 'Hide' })).toHaveAttribute('aria-pressed', 'true');
    await user.click(screen.getByRole('button', { name: 'Hide' }));
    expect(password).toHaveAttribute('type', 'password');
  });

  it('prefills the email from ?email=', async () => {
    renderApp('/login?email=maya.chen%40example.com');
    expect(await screen.findByLabelText('Email')).toHaveValue('maya.chen@example.com');
  });

  it('clears the password after a wrong one and keeps the email', async () => {
    addAna();
    const { user } = renderApp('/login');
    await user.type(await screen.findByLabelText('Email'), 'ana@x.com');
    await user.type(screen.getByLabelText('Password'), 'nope-nope');
    await user.click(screen.getByRole('button', { name: 'Log in' }));
    await screen.findByText('Email or password is wrong');
    expect(screen.getByLabelText('Password')).toHaveValue('');
    expect(screen.getByLabelText('Email')).toHaveValue('ana@x.com');
  });

  it('keeps what was typed after a network error', async () => {
    server.use(http.post('*/api/v1/auth/login', () => HttpResponse.error()));
    const { user } = renderApp('/login');
    await user.type(await screen.findByLabelText('Email'), 'ana@x.com');
    await user.type(screen.getByLabelText('Password'), 'password1');
    await user.click(screen.getByRole('button', { name: 'Log in' }));
    await screen.findByText(NETWORK_MESSAGE);
    expect(screen.getByLabelText('Password')).toHaveValue('password1');
  });

  it('announces the busy state and keeps the label', async () => {
    addAna();
    server.use(
      http.post('*/api/v1/auth/login', async () => {
        await new Promise((r) => setTimeout(r, 50));
        return HttpResponse.json({ id: 'u1', name: 'Ana', email: 'ana@x.com', role: 'user' });
      }),
    );
    const { user } = renderApp('/login');
    await user.type(await screen.findByLabelText('Email'), 'ana@x.com');
    await user.type(screen.getByLabelText('Password'), 'password1');
    const button = screen.getByRole('button', { name: 'Log in' });
    await user.click(button);
    expect(button).toHaveAttribute('aria-disabled', 'true');
    expect(button).not.toBeDisabled();
    expect(button).toHaveAccessibleDescription('Logging you in…');
    await screen.findByText('Welcome back, Ana.');
  });

  it('has no axe violations', async () => {
    const { container } = renderApp('/login?next=%2Fshare');
    await screen.findByRole('heading', { name: 'Welcome back' });
    await expectNoAxeViolations(container);
  });

  it('has no axe violations with an error showing', async () => {
    const { container, user } = renderApp('/login');
    await user.click(await screen.findByRole('button', { name: 'Log in' }));
    await screen.findByText('Enter your email.');
    await expectNoAxeViolations(container);
  });
});
