import { withAuth } from '@workos-inc/authkit-nextjs';
import type { Metadata } from 'next';

import { signOutAction } from '@/app/auth/actions';
import { WorkspaceList } from '@/features/workspace/workspace-list';

export const metadata: Metadata = { title: 'Workspaces' };
export const dynamic = 'force-dynamic';

export default async function WorkspacesPage() {
  const { user } = await withAuth({ ensureSignedIn: true });
  return (
    <main className="state-page">
      <section className="state-card">
        <p className="eyebrow">
          <span /> Signed in as {user.email}
        </p>
        <h1>Your Guild workspaces</h1>
        <p>
          Every project is one shared infinite canvas. Membership and changes stream from Guild
          Cloud.
        </p>
        <WorkspaceList />
        <div className="nav-actions">
          <form action={signOutAction}>
            <button className="button button-ghost" type="submit">
              Sign out
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
