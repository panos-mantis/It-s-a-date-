import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import { expectNoAxeViolations } from '../../test/axe';
import { Card } from './Card';

const base = { href: '/ideas/abc', title: 'Pottery for two', image: null };

function setup(props: Partial<Parameters<typeof Card>[0]> = {}) {
  return render(
    <MemoryRouter>
      <Card {...base} {...props} />
    </MemoryRouter>,
  );
}

describe('Card', () => {
  it('links the title to href', () => {
    setup();
    expect(screen.getByRole('link', { name: 'Pottery for two' })).toHaveAttribute(
      'href',
      '/ideas/abc',
    );
  });

  it('shows a placeholder when image is null', () => {
    const { container } = setup();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(container.querySelector('svg[aria-hidden="true"]')).toBeInTheDocument();
  });

  it('renders the image with alt', () => {
    setup({ image: { src: '/p.jpg', alt: 'Two people at a pottery wheel' } });
    expect(screen.getByRole('img', { name: 'Two people at a pottery wheel' })).toBeInTheDocument();
  });

  it('keeps the action clickable on its own', async () => {
    const onClick = vi.fn();
    setup({ action: <button onClick={onClick}>Save</button> });
    await userEvent.setup().click(screen.getByRole('button', { name: 'Save' }));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('shows rating, meta, chip and badge', () => {
    setup({
      rating: { value: 4.2, count: 3 },
      meta: 'Brooklyn',
      chip: <span>Cosy</span>,
      badge: 'Staff pick',
    });
    expect(screen.getByText('Rated 4.2 out of 5 from 3 ratings')).toBeInTheDocument();
    expect(screen.getByText('Brooklyn')).toBeInTheDocument();
    expect(screen.getByText('Cosy')).toBeInTheDocument();
    expect(screen.getByText('Staff pick')).toBeInTheDocument();
  });

  it('has no axe violations', async () => {
    const { container } = setup({
      rating: { value: 4.2, count: 3 },
      meta: 'Brooklyn',
      action: <button aria-label="Save idea">Heart</button>,
    });
    await expectNoAxeViolations(container);
  });
});
