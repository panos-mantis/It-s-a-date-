import { ideaCreateSchema } from '@itsadate/shared';
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import type { UserEvent } from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { expectNoAxeViolations } from '../../test/axe';
import { authStore } from '../../test/msw/handlers';
import { ideaStore, uploadStore } from '../../test/msw/ideas-handlers';
import { server } from '../../test/msw/server';
import { renderApp } from '../../test/render';

beforeEach(() => {
  authStore.addUser({ name: 'Maya Chen', email: 'maya.chen@example.com', password: 'password1' });
  authStore.loginAs('maya.chen@example.com');
});

let posted: unknown;
const listener = async ({ request }: { request: Request }) => {
  if (request.method === 'POST' && new URL(request.url).pathname === '/api/v1/ideas') {
    posted = await request.clone().json();
  }
};
beforeEach(() => {
  posted = undefined;
  server.events.on('request:start', listener);
});
afterEach(() => {
  server.events.removeListener('request:start', listener);
});

async function openShare() {
  const view = renderApp('/share');
  await screen.findByRole('heading', { level: 1, name: 'Share an idea' });
  await screen.findByRole('button', { name: 'Food' });
  return view;
}

async function pickPhoto(name = 'pastry-walk.jpg') {
  const input = screen.getByLabelText(/add a photo/i);
  fireEvent.change(input, { target: { files: [new File(['x'], name, { type: 'image/jpeg' })] } });
  await screen.findByRole('button', { name: 'Replace' });
  await waitFor(() => expect(screen.queryByRole('progressbar')).not.toBeInTheDocument());
}

async function fillAll(user: UserEvent) {
  await pickPhoto();
  await user.type(screen.getByLabelText('Title'), 'Sunday pastry walk');
  await user.type(
    screen.getByLabelText('Description'),
    'Pick three bakeries within walking distance and buy one pastry at each.',
  );
  await user.click(screen.getByRole('button', { name: 'Food' }));
  await user.click(screen.getByRole('button', { name: 'Adventure' }));
  await user.selectOptions(screen.getByLabelText('Place type'), 'cafe');
  await user.click(screen.getByRole('radio', { name: '$, low budget' }));
  await user.click(screen.getByRole('radio', { name: '1–2 hours' }));
}

describe('Share', () => {
  it('starts empty, with counters and hints', async () => {
    const { container } = await openShare();
    expect(screen.getByText('0/80')).toBeInTheDocument();
    expect(screen.getByText('0/2000')).toBeInTheDocument();
    expect(screen.getByText('At least 20 characters')).toBeInTheDocument();
    expect(screen.getByText('Pick up to 3')).toBeInTheDocument();
    expect(screen.getByLabelText('Place type')).toHaveValue('');
    expect(screen.getByRole('radio', { name: '$, low budget' })).not.toBeChecked();
    expect(screen.getByText('An admin checks every idea before it goes live.')).toBeVisible();
    expect(screen.getByRole('button', { name: 'Send for review' })).toBeEnabled();
    await expectNoAxeViolations(container);
  });

  it('happy path: uploads, submits a valid body and shows the success view', async () => {
    const { user, container } = await openShare();
    await fillAll(user);
    expect(screen.getByText('18/80')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Send for review' }));

    const heading = await screen.findByRole('heading', {
      level: 2,
      name: 'Thanks! Your idea is waiting for review.',
    });
    expect(heading).toHaveFocus();
    expect(ideaCreateSchema.safeParse(posted).success).toBe(true);
    expect(posted).toMatchObject({
      title: 'Sunday pastry walk',
      placeType: 'cafe',
      duration: 'short',
      image: { publicId: expect.stringContaining('itsadate/dev/') as string },
    });
    expect(screen.queryByLabelText('Title')).not.toBeInTheDocument();

    const card = screen.getByRole('article');
    expect(within(card).getByText('Sunday pastry walk')).toBeInTheDocument();
    expect(within(card).getByText('Pending review')).toBeInTheDocument();
    expect(within(card).getByText('Food')).toBeInTheDocument();
    expect(within(card).getByText('Adventure')).toBeInTheDocument();
    expect(within(card).queryByRole('link')).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'See it on your profile' })).toHaveAttribute(
      'href',
      '/profile#ideas',
    );
    expect(ideaStore.all()[0]?.title).toBe('Sunday pastry walk');
    await expectNoAxeViolations(container);

    await user.click(screen.getByRole('button', { name: 'Share another' }));
    expect(await screen.findByLabelText('Title')).toHaveValue('');
    expect(screen.getByLabelText(/add a photo/i)).toBeInTheDocument();
  });

  it('client validation: an empty submit shows each error and the summary', async () => {
    const { user, container } = await openShare();
    await user.click(screen.getByRole('button', { name: 'Send for review' }));
    const summary = (await screen.findByText(/Check the 7 fields/)).closest(
      '[role="alert"]',
    ) as HTMLElement;
    expect(summary).toHaveTextContent('Check the 7 fields marked below.');
    expect(screen.getByLabelText('Title')).toHaveAccessibleDescription(
      /Use at least 3 characters\./,
    );
    expect(screen.getByLabelText('Description')).toHaveAccessibleDescription(
      /Write at least 20 characters\. You have 0 so far\./,
    );
    expect(screen.getAllByText('Add a photo.').length).toBeGreaterThan(0);
    expect(screen.getByText('Pick at least 1 tag.')).toBeInTheDocument();
    expect(screen.getByText('Choose a place type.')).toBeInTheDocument();
    expect(screen.getByText('Pick a budget.')).toBeInTheDocument();
    expect(screen.getByText('Pick how long it takes.')).toBeInTheDocument();
    expect(posted).toBeUndefined();
    // The first error takes focus; a summary link jumps to a field.
    await user.click(within(summary).getByRole('link', { name: 'Description' }));
    expect(screen.getByLabelText('Description')).toHaveFocus();
    await expectNoAxeViolations(container);
  });

  it('422 from the API lands on the field', async () => {
    server.use(
      http.post('*/api/v1/ideas', () =>
        HttpResponse.json(
          {
            error: {
              code: 'VALIDATION',
              message: 'Check the highlighted fields',
              details: {
                issues: [{ location: 'body', path: 'title', message: 'That title is taken' }],
              },
            },
          },
          { status: 422 },
        ),
      ),
    );
    const { user } = await openShare();
    await fillAll(user);
    await user.click(screen.getByRole('button', { name: 'Send for review' }));
    expect(await screen.findByText('That title is taken')).toBeInTheDocument();
    expect(screen.getByLabelText('Title')).toHaveAccessibleDescription(/That title is taken/);
    expect(screen.getByLabelText('Title')).toHaveFocus();
    expect(
      screen
        .getByText('Check the 1 field marked below.', { exact: false })
        .closest('[role="alert"]'),
    ).toBeInTheDocument();
    // Nothing was cleared.
    expect(screen.getByLabelText('Title')).toHaveValue('Sunday pastry walk');
  });

  it('shows a form-level message when the connection fails', async () => {
    server.use(http.post('*/api/v1/ideas', () => HttpResponse.error()));
    const { user } = await openShare();
    await fillAll(user);
    await user.click(screen.getByRole('button', { name: 'Send for review' }));
    expect(
      (await screen.findByText(/can't reach the server/i)).closest('[role="alert"]'),
    ).toBeInTheDocument();
  });

  it('3 tags disables the rest', async () => {
    const { user } = await openShare();
    await user.click(screen.getByRole('button', { name: 'Food' }));
    await user.click(screen.getByRole('button', { name: 'Adventure' }));
    await user.click(screen.getByRole('button', { name: 'Home' }));
    expect(screen.getByText("You've picked 3. Remove one to pick another.")).toBeInTheDocument();
    const dancing = screen.getByRole('button', { name: 'Dancing' });
    expect(dancing).toHaveAttribute('aria-disabled', 'true');
    await user.click(dancing);
    expect(dancing).toHaveAttribute('aria-pressed', 'false');
    await user.click(screen.getByRole('button', { name: 'Home' }));
    expect(screen.getByText('Pick up to 3')).toBeInTheDocument();
    expect(dancing).not.toHaveAttribute('aria-disabled');
  });

  it('keeps the submit disabled, and says why, while the upload runs', async () => {
    uploadStore.delay(400);
    await openShare();
    const input = screen.getByLabelText(/add a photo/i);
    fireEvent.change(input, {
      target: { files: [new File(['x'], 'slow.jpg', { type: 'image/jpeg' })] },
    });
    const submit = await screen.findByRole('button', { name: 'Send for review' });
    expect(submit).toBeDisabled();
    expect(submit).toHaveAccessibleDescription('You can send it once the photo has uploaded.');
    await waitFor(() => expect(submit).toBeEnabled());
    expect(submit).toHaveAccessibleDescription('An admin checks every idea before it goes live.');
  });

  it('shows the dropped-connection message from the upload', async () => {
    uploadStore.mode('network');
    await openShare();
    fireEvent.change(screen.getByLabelText(/add a photo/i), {
      target: { files: [new File(['x'], 'pastry-walk.jpg', { type: 'image/jpeg' })] },
    });
    expect(await screen.findByText("pastry-walk.jpg didn't finish uploading.")).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
  });

  it('shows an error with a retry when tags cannot load', async () => {
    server.use(http.get('*/api/v1/tags', () => HttpResponse.error()));
    renderApp('/share');
    expect(await screen.findByText("We couldn't load the tags.")).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
  });

  it('sends a logged-out visitor to log in', async () => {
    authStore.logout();
    const { router } = renderApp('/share');
    await screen.findByText('Log in to share your idea');
    expect(router.state.location.pathname).toBe('/login');
  });
});
