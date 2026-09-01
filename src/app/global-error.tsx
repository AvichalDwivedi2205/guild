'use client';

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body>
        <main className="state-page">
          <div className="state-card" role="alert">
            <h1>Guild could not start.</h1>
            <p>Check configuration, then retry.</p>
            <button className="button button-dark" type="button" onClick={reset}>
              Retry
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
