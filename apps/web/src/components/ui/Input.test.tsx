import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { expectNoAxeViolations } from '../../test/axe';
import { Input } from './Input';

describe('Input', () => {
  it('links label, hint and error', () => {
    render(<Input label="Email" hint="We never share it" error="Enter a valid email" />);
    const input = screen.getByLabelText('Email');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    const error = screen.getByText('Enter a valid email');
    const hint = screen.getByText('We never share it');
    expect(input.getAttribute('aria-describedby')).toBe(`${error.id} ${hint.id}`);
    expect(error).toBeVisible();
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
