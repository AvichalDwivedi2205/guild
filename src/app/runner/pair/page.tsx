import { withAuth } from '@workos-inc/authkit-nextjs';
import type { Metadata } from 'next';

import { PairRunner } from '@/features/runner/pair-runner';

export const metadata: Metadata = { title: 'Pair Guild Runner' };
export const dynamic = 'force-dynamic';

export default async function PairRunnerPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>;
}) {
  await withAuth({ ensureSignedIn: true });
  const { code = '' } = await searchParams;
  return (
    <main className="state-page">
      <section className="state-card">
        <p className="eyebrow">
          <span /> Local execution boundary
        </p>
        <h1>Pair Guild Runner</h1>
        <p>
          Approve this machine for selected workspaces. Guild Cloud stores no Codex or Claude
          credentials; Runner uses already signed-in local clients.
        </p>
        <PairRunner initialCode={code} />
      </section>
    </main>
  );
}
