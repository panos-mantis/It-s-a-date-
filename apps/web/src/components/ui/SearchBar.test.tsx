import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { expectNoAxeViolations } from '../../test/axe';
import { SearchBar, type SearchValues } from './SearchBar';

const vibes = [
  { value: 'food', label: 'Food' },
  { value: 'adventure', label: 'Adventure' },
];
const empty: SearchValues = { q: '', tag: '', budget: '' };

describe('SearchBar', () => {
  it('labels the What, Vibe and Budget fields', () => {
    render(<SearchBar initial={empty} vibes={vibes} onSubmit={() => {}} />);
    expect(screen.getByRole('search')).toBeInTheDocument();
    expect(screen.getByLabelText('What')).toBeInTheDocument();
    expect(screen.getByLabelText('Vibe')).toBeInTheDocument();
    expect(screen.getByLabelText('Budget')).toBeInTheDocument();
  });

  it('submits trimmed values', async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    render(<SearchBar initial={empty} vibes={vibes} onSubmit={onSubmit} />);
    await user.type(screen.getByLabelText('What'), '  sushi ');
    await user.selectOptions(screen.getByLabelText('Vibe'), 'food');
    await user.selectOptions(screen.getByLabelText('Budget'), '$$');
    await user.click(screen.getByRole('button', { name: 'Search' }));
    expect(onSubmit).toHaveBeenCalledWith({ q: 'sushi', tag: 'food', budget: '2' });
  });

  it('starts from initial', () => {
    render(
      <SearchBar
        initial={{ q: 'picnic', tag: '', budget: '3' }}
        vibes={vibes}
        onSubmit={() => {}}
      />,
    );
    expect(screen.getByLabelText('What')).toHaveValue('picnic');
    expect(screen.getByLabelText('Budget')).toHaveValue('3');
    expect(screen.getByLabelText('Vibe')).toHaveValue('');
  });

  it('has no axe violations', async () => {
    const { container } = render(<SearchBar initial={empty} vibes={vibes} onSubmit={() => {}} />);
    await expectNoAxeViolations(container);
  });
});
