'use client';

export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="state-page">
      <div className="state-card" role="alert">
        <h1>Guild lost the connection.</h1>
        <p>Your work remains durable. Reconnect and try loading this surface again.</p>
        <button className="button button-dark" type="button" onClick={reset}>
          Try again
        </button>
      </div>
    </main>
  );
}
