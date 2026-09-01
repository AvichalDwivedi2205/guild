import { withAuth } from '@workos-inc/authkit-nextjs';
import type { Metadata } from 'next';

import { LiveWorkspace } from '@/features/workspace/live-workspace';

export const metadata: Metadata = { title: 'Workspace' };
export const dynamic = 'force-dynamic';

export default async function WorkspacePage({
  params,
}: {
  params: Promise<{ workspaceId: string }>;
}) {
  await withAuth({ ensureSignedIn: true });
  const { workspaceId } = await params;
  return <LiveWorkspace workspaceId={workspaceId} />;
}
