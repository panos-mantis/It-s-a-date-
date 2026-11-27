import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { expectNoAxeViolations } from '../../test/axe';
import { Input } from './Input';

describe('Input', () => {
  it('links the label and the hint', () => {
    render(<Input label="Email" hint="We never share it" />);
    const input = screen.getByLabelText('Email');
    expect(input.getAttribute('aria-describedby')).toBe(screen.getByText('We never share it').id);
  });

  it('shows the error in place of the hint', () => {
    render(<Input label="Email" hint="We never share it" error="Enter a valid email" />);
    const input = screen.getByLabelText('Email');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    const error = screen.getByText('Enter a valid email');
    expect(input.getAttribute('aria-describedby')).toBe(error.id);
    expect(error).toBeVisible();
    expect(screen.queryByText('We never share it')).not.toBeInTheDocument();
  });

  it('renders an action inside the field and extra content under the error', () => {
    render(
      <Input
        label="Password"
        error="Bad"
        action={<button type="button">Show</button>}
        afterError={<a href="/login">Log in instead</a>}
      />,
    );
    expect(screen.getByRole('button', { name: 'Show' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Log in instead' })).toBeInTheDocument();
  });

  it('forwards a ref', () => {
    const ref = createRef<HTMLInputElement>();
    render(<Input label="Name" ref={ref} />);
    expect(ref.current).toBe(screen.getByLabelText('Name'));
  });

  it('has no axe violations', async () => {
    const { container } = render(<Input label="Email" hint="Hint" error="Bad" />);
    await expectNoAxeViolations(container);
  });
});
