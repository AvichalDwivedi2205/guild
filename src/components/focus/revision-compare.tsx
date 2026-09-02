'use client';

import { useState } from 'react';

import styles from './focus.module.css';

export function RevisionCompare({
  leftLabel,
  rightLabel,
  leftSrc,
  rightSrc,
  changedScreens,
}: {
  leftLabel: string;
  rightLabel: string;
  leftSrc?: string;
  rightSrc?: string;
  changedScreens: readonly string[];
}) {
  const [mode, setMode] = useState<'side-by-side' | 'slider'>('side-by-side');
  const [slider, setSlider] = useState(50);

  return (
    <section className={styles.compare} data-mode={mode} aria-label="Revision compare">
      <header>
        <button
          type="button"
          onClick={() => setMode('side-by-side')}
          aria-pressed={mode === 'side-by-side'}
        >
          Side by side
        </button>
        <button type="button" onClick={() => setMode('slider')} aria-pressed={mode === 'slider'}>
          Slider
        </button>
        <p>
          Comparing {leftLabel} with {rightLabel}
          {changedScreens.length > 0 ? ` · changed: ${changedScreens.join(', ')}` : ''}
        </p>
      </header>
      {mode === 'side-by-side' ? (
        <>
          {leftSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={leftSrc} alt={`${leftLabel} screenshot`} />
          ) : (
            <p>{leftLabel} screenshot unavailable.</p>
          )}
          {rightSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={rightSrc} alt={`${rightLabel} screenshot`} />
          ) : (
            <p>{rightLabel} screenshot unavailable.</p>
          )}
        </>
      ) : (
        <div style={{ position: 'relative', overflow: 'hidden' }}>
          {rightSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={rightSrc} alt={`${rightLabel} screenshot`} />
          ) : null}
          {leftSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={leftSrc}
              alt={`${leftLabel} screenshot`}
              style={{
                position: 'absolute',
                inset: 0,
                clipPath: `inset(0 ${100 - slider}% 0 0)`,
              }}
            />
          ) : null}
          <input
            type="range"
            min={0}
            max={100}
            value={slider}
            onChange={(event) => setSlider(Number(event.target.value))}
            aria-label="Compare slider"
          />
        </div>
      )}
    </section>
  );
}
