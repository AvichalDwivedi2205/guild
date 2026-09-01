import { withAuth } from '@workos-inc/authkit-nextjs';
import type { Metadata } from 'next';

import { WorkspaceList } from '@/features/workspace/workspace-list';

export const metadata: Metadata = { title: 'Workspaces' };
export const dynamic = 'force-dynamic';

export default async function WorkspacesPage() {
  const { user } = await withAuth({ ensureSignedIn: true });
  return <WorkspaceList userName={user.firstName || user.email} userEmail={user.email} />;
}
