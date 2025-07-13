import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import SlidingBar from './SlidingBar';

describe('SlidingBar', () => {
  test('renders the sliding bar', () => {
    render(<SlidingBar />);
    const bar = screen.getByTestId('sliding-bar');
    expect(bar).toBeInTheDocument();
  });

  test('renders the sliding text', () => {
    render(<SlidingBar />);
    expect(screen.getAllByText(/Find your next match on circuit/i).length).toBeGreaterThan(1);
  });

  test('renders the blue heart emoji between phrases', () => {
    render(<SlidingBar />);
    const hearts = screen.getAllByLabelText('blue heart');
    expect(hearts.length).toBeGreaterThan(1);
    hearts.forEach(heart => {
      expect(heart).toHaveTextContent('💙');
      expect(heart).toHaveClass('sliding-bar__heart');
    });
  });
}); 