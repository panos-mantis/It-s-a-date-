import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { expectNoAxeViolations } from '../../test/axe';
import { StarRating, StarRatingInput } from './StarRating';

describe('StarRating', () => {
  it('reads out the average and count', () => {
    render(<StarRating value={4.6} count={128} />);
    expect(screen.getByText('Rated 4.6 out of 5 from 128 ratings')).toBeInTheDocument();
    expect(screen.getByText('4.6')).toBeInTheDocument();
    expect(screen.getByText('(128)')).toBeInTheDocument();
  });

  it('uses the singular for one rating', () => {
    render(<StarRating value={5} count={1} />);
    expect(screen.getByText('Rated 5.0 out of 5 from 1 rating')).toBeInTheDocument();
  });

  it('says New with no ratings', () => {
    render(<StarRating value={0} count={0} />);
    expect(screen.getByText('New')).toBeInTheDocument();
    expect(screen.getByText('No ratings yet')).toBeInTheDocument();
  });

  it('input: picking 4 stars calls onChange(4)', async () => {
    const onChange = vi.fn();
    render(<StarRatingInput value={null} onChange={onChange} />);
    await userEvent.setup().click(screen.getByLabelText('4 stars'));
    expect(onChange).toHaveBeenCalledWith(4);
  });

  it('input: arrow keys move the choice', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<StarRatingInput value={3} onChange={onChange} />);
    screen.getByLabelText('3 stars').focus();
    await user.keyboard('{ArrowRight}');
    expect(onChange).toHaveBeenCalledWith(4);
  });

  it('input: has a "Your rating" group', () => {
    render(<StarRatingInput value={null} onChange={() => {}} />);
    expect(screen.getByRole('group', { name: 'Your rating' })).toBeInTheDocument();
  });

  it('has no axe violations', async () => {
    const { container } = render(
      <div>
        <StarRating value={4.6} count={128} />
        <StarRating value={0} count={0} />
        <StarRatingInput value={2} onChange={() => {}} />
      </div>,
    );
    await expectNoAxeViolations(container);
  });
});
