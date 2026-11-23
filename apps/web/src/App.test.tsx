import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import App from './App';

describe('App', () => {
  it('renders the heading', () => {
    render(<App />);
    expect(screen.getByRole('heading', { name: "It's a Date" })).toBeInTheDocument();
  });
});

describe('test cleanup', () => {
  it('unmounts between tests (second render finds a single heading)', () => {
    render(<App />);
    expect(screen.getByRole('heading', { name: "It's a Date" })).toBeInTheDocument();
  });
});
