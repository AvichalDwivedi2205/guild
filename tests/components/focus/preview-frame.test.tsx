// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest';

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { PreviewFrame } from '@/components/focus/preview-frame';

afterEach(cleanup);

describe('PreviewFrame', () => {
  it('keeps the live hosted site visible while annotation mode owns pointer input', () => {
    render(
      <PreviewFrame
        title="Cinema research"
        src="https://cinemaverse.example/research"
        origin="https://cinemaverse.example"
        mode="annotate"
        sessionNonce="session-1"
        designRevisionId="revision-1"
        screenKey="research"
      />,
    );

    expect(screen.getByTitle('Cinema research')).toHaveAttribute(
      'src',
      'https://cinemaverse.example/research',
    );
    expect(screen.getByText('Annotate')).toBeVisible();
  });

  it('keeps an optional bridge absence out of the presentation surface', () => {
    render(
      <PreviewFrame
        title="Cinema research"
        src="https://cinemaverse.example/research"
        origin="https://cinemaverse.example"
        mode="interact"
        sessionNonce="session-1"
        designRevisionId="revision-1"
        screenKey="research"
      />,
    );

    fireEvent.load(screen.getByTitle('Cinema research'));

    expect(screen.getByTitle('Cinema research')).toBeVisible();
    expect(screen.queryByText(/Preview Bridge unavailable/)).not.toBeInTheDocument();
  });
});
