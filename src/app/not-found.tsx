import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="state-page">
      <div className="state-card">
        <h1>Workspace not found.</h1>
        <p>It may have moved, or your account may not be a member.</p>
        <Link className="button button-dark" href="/workspaces">
          Back to workspaces
        </Link>
      </div>
    </main>
  );
}
