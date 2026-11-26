import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { expectNoAxeViolations } from '../../test/axe';
import { Button } from './Button';

describe('Button', () => {
  it('defaults to type="button"', () => {
    render(<Button>Save</Button>);
    expect(screen.getByRole('button')).toHaveAttribute('type', 'button');
  });

  it('loading disables and marks busy', () => {
    render(<Button loading>Log in</Button>);
    const button = screen.getByRole('button', { name: 'Log in' });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-busy', 'true');
  });

  it('uses dark text on coral', () => {
    render(<Button>Go</Button>);
    const cls = screen.getByRole('button').className;
    expect(cls).toContain('bg-accent');
    expect(cls).toContain('text-accent-on');
  });

  it('busy keeps the label, sets aria-disabled and ignores clicks', async () => {
    const onClick = vi.fn();
    render(
      <Button busy onClick={onClick}>
        Send for review
      </Button>,
    );
    const button = screen.getByRole('button', { name: 'Send for review' });
    expect(button).toHaveAttribute('aria-disabled', 'true');
    expect(button).not.toBeDisabled();
    await userEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('danger variant uses on-danger text', () => {
    render(<Button variant="danger">Delete</Button>);
    const cls = screen.getByRole('button').className;
    expect(cls).toContain('bg-danger');
    expect(cls).toContain('text-on-danger');
  });

  it('ghost tone colours the text and underlines on hover', () => {
    render(
      <Button variant="ghost" tone="success">
        Approve
      </Button>,
    );
    const cls = screen.getByRole('button').className;
    expect(cls).toContain('text-success');
    expect(cls).toContain('hover:underline');
  });

  it('has no axe violations', async () => {
    const { container } = render(
      <div>
        <Button>Primary</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="ghost">Ghost</Button>
      </div>,
    );
    await expectNoAxeViolations(container);
  });
});
