import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { authStore } from '../../test/msw/handlers';
import { expectNoAxeViolations } from '../../test/axe';
import { renderApp } from '../../test/render';

async function fill(
  user: ReturnType<typeof renderApp>['user'],
  v: { name?: string; email: string; password: string },
) {
  await user.type(await screen.findByLabelText('Name'), v.name ?? 'Ana');
  await user.type(screen.getByLabelText('Email'), v.email);
  await user.type(screen.getByLabelText('Password'), v.password);
  await user.click(screen.getByRole('button', { name: 'Sign up' }));
}

describe('SignupPage', () => {
  it('signs up and lands home', async () => {
    const { user } = renderApp('/signup');
    await fill(user, { email: 'ana@x.com', password: 'password1' });
    expect(await screen.findByRole('button', { name: 'Account menu for Ana' })).toBeVisible();
    expect(await screen.findByText("You're in. Welcome, Ana.")).toBeVisible();
  });

  it('puts a taken email on the email field', async () => {
    authStore.addUser({ name: 'Bo', email: 'ana@x.com', password: 'password1' });
    const { user } = renderApp('/signup');
    await fill(user, { email: 'ana@x.com', password: 'password1' });
    expect(await screen.findByText('An account with this email already exists')).toBeVisible();
    expect(screen.getByLabelText('Email')).toHaveAttribute('aria-invalid', 'true');
  });

  it('maps a 422 issue to its field', async () => {
    const { user } = renderApp('/signup');
    await fill(user, { email: 'ana@example.com', password: 'password1' });
    expect(await screen.findByText('Use a real email address')).toBeVisible();
    expect(screen.getByLabelText('Email')).toHaveAttribute('aria-invalid', 'true');
  });

  it('rejects a short password before sending', async () => {
    const { user } = renderApp('/signup');
    await fill(user, { email: 'ana@x.com', password: '1234567' });
    expect(await screen.findByText('Use at least 8 characters.', { selector: 'p' })).toBeVisible();
    expect(screen.queryByRole('button', { name: /Account menu/ })).not.toBeInTheDocument();
  });

  it('shows copy for empty fields and a bad email', async () => {
    const { user } = renderApp('/signup');
    await user.click(await screen.findByRole('button', { name: 'Sign up' }));
    expect(await screen.findByText('Enter at least 2 characters.')).toBeVisible();
    expect(screen.getByText('Enter your email.')).toBeVisible();
    expect(screen.getByText('Enter your password.')).toBeVisible();
    await user.type(screen.getByLabelText('Email'), 'nope');
    await user.click(screen.getByRole('button', { name: 'Sign up' }));
    expect(await screen.findByText('Enter an email like name@example.com.')).toBeVisible();
  });

  it('has no axe violations', async () => {
    const { container } = renderApp('/signup');
    await screen.findByRole('heading', { name: 'Create your account' });
    await expectNoAxeViolations(container);
  });
});
