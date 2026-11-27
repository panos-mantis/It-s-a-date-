import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { NETWORK_MESSAGE } from '../../lib/api';
import { BusyStatus, FormError } from '.';

describe('FormError', () => {
  it('renders nothing without a message', () => {
    const { container } = render(<FormError />);
    expect(container).toBeEmptyDOMElement();
  });

  it('shows the message in an alert', () => {
    render(<FormError message={NETWORK_MESSAGE} />);
    expect(screen.getByRole('alert')).toHaveTextContent(NETWORK_MESSAGE);
  });
});

describe('BusyStatus', () => {
  it('keeps its status node mounted and fills it while busy', () => {
    const { rerender } = render(<BusyStatus id="s" busy={false} text="Saving…" />);
    expect(screen.getByRole('status')).toBeEmptyDOMElement();
    rerender(<BusyStatus id="s" busy text="Saving…" />);
    expect(screen.getByRole('status')).toHaveTextContent('Saving…');
  });
});
