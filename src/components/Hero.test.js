import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import '@testing-library/jest-dom';
import Hero from './Hero';

describe('Hero component', () => {
  it('renders a video background', () => {
    render(<Hero />, { wrapper: MemoryRouter });
    const video = screen.getByTestId('hero-video-bg');
    expect(video).toBeInTheDocument();
    expect(video.tagName).toBe('VIDEO');
  });

  it('does not render the lady image', () => {
    render(<Hero />, { wrapper: MemoryRouter });
    const images = screen.queryAllByRole('img');
    // Should not find any image with alt containing "lady" or src containing "lady.png"
    const hasLadyImage = images.some(img =>
      (img.alt && img.alt.toLowerCase().includes('lady')) ||
      (img.src && img.src.includes('lady.png'))
    );
    expect(hasLadyImage).toBe(false);
  });

  it('renders the main hero content and larger text', () => {
    render(<Hero />, { wrapper: MemoryRouter });
    // Find the heading
    const heading = screen.getByRole('heading', { name: /Creating Sparks/i });
    expect(heading).toHaveStyle({ fontSize: '72px' });
    // Find the paragraph
    const p = screen.getByText(/Lorem ipsum dolor sit amet/i);
    expect(p).toHaveStyle({ fontSize: '24px' });
  });

  it('renders a larger Spark your connection button', () => {
    render(<Hero />, { wrapper: MemoryRouter });
    const button = screen.getByRole('button', { name: /Spark your connection/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveStyle({ fontSize: '20px', padding: '16px 40px' });
  });

  it('navigates to /create-account when Spark your connection is clicked', () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <Routes>
          <Route path="/" element={<Hero />} />
          <Route path="/create-account" element={<div>Sign Up Page</div>} />
        </Routes>
      </MemoryRouter>
    );
    const button = screen.getByRole('button', { name: /Spark your connection/i });
    fireEvent.click(button);
    expect(screen.getByText(/Sign Up Page/i)).toBeInTheDocument();
  });

  it('sliding bar is flush with the bottom of the hero section', () => {
    render(<Hero />);
    const hero = screen.getByTestId('hero-section');
    const bar = screen.getByTestId('sliding-bar');

    const heroRect = hero.getBoundingClientRect();
    const barRect = bar.getBoundingClientRect();

    expect(Math.abs(heroRect.bottom - barRect.top)).toBeLessThanOrEqual(1);
  });
}); 