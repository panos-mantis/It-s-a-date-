import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { expectNoAxeViolations } from '../../test/axe';
import { SearchBar, type SearchValues } from './SearchBar';

const vibes = [
  { value: 'food', label: 'Food' },
  { value: 'adventure', label: 'Adventure' },
];
const empty: SearchValues = { q: '', tag: '', budget: '', duration: '' };

describe('SearchBar', () => {
  it('labels the What, Vibe and Budget fields', () => {
    render(<SearchBar initial={empty} vibes={vibes} onSubmit={() => {}} />);
    expect(screen.getByRole('search')).toBeInTheDocument();
    expect(screen.getByLabelText('What')).toBeInTheDocument();
    // Matches ideaQuerySchema.q.
    expect(screen.getByLabelText('What')).toHaveAttribute('maxlength', '100');
    expect(screen.getByLabelText('Vibe')).toBeInTheDocument();
    expect(screen.getByLabelText('Budget')).toBeInTheDocument();
  });

  it('submits trimmed values and keeps the duration it was given', async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    render(
      <SearchBar initial={{ ...empty, duration: 'half-day' }} vibes={vibes} onSubmit={onSubmit} />,
    );
    await user.type(screen.getByLabelText('What'), '  sushi ');
    await user.selectOptions(screen.getByLabelText('Vibe'), 'food');
    await user.selectOptions(screen.getByLabelText('Budget'), '$$');
    await user.click(screen.getByRole('button', { name: 'Search' }));
    expect(onSubmit).toHaveBeenCalledWith({
      q: 'sushi',
      tag: 'food',
      budget: '2',
      duration: 'half-day',
    });
  });

  it('starts from initial', () => {
    render(
      <SearchBar
        initial={{ q: 'picnic', tag: '', budget: '3', duration: '' }}
        vibes={vibes}
        onSubmit={() => {}}
      />,
    );
    expect(screen.getByLabelText('What')).toHaveValue('picnic');
    expect(screen.getByLabelText('Budget')).toHaveValue('3');
    expect(screen.getByLabelText('Vibe')).toHaveValue('');
  });

  it('follows initial when it changes (Back, a category pick)', () => {
    const { rerender } = render(
      <SearchBar initial={{ ...empty, q: 'picnic' }} vibes={vibes} onSubmit={() => {}} />,
    );
    rerender(<SearchBar initial={{ ...empty, tag: 'food' }} vibes={vibes} onSubmit={() => {}} />);
    expect(screen.getByLabelText('What')).toHaveValue('');
    expect(screen.getByLabelText('Vibe')).toHaveValue('food');
  });

  it('a filters pick submits the current values with that duration', async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    render(
      <SearchBar
        initial={empty}
        vibes={vibes}
        onSubmit={onSubmit}
        filters={({ duration, setDuration }) => (
          <button type="button" onClick={() => setDuration('short')}>
            Pick short ({duration || 'none'})
          </button>
        )}
      />,
    );
    await user.type(screen.getByLabelText('What'), 'dumplings');
    await user.click(screen.getByRole('button', { name: 'Pick short (none)' }));
    expect(onSubmit).toHaveBeenCalledWith({
      q: 'dumplings',
      tag: '',
      budget: '',
      duration: 'short',
    });
  });

  it('renders the phone slot alongside the form', () => {
    render(
      <SearchBar
        initial={empty}
        vibes={vibes}
        onSubmit={() => {}}
        phone={<button type="button">Find a date idea</button>}
      />,
    );
    expect(screen.getByRole('button', { name: 'Find a date idea' })).toBeInTheDocument();
  });

  it('has no axe violations', async () => {
    const { container } = render(<SearchBar initial={empty} vibes={vibes} onSubmit={() => {}} />);
    await expectNoAxeViolations(container);
  });
});
