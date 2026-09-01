'use client';

import { useAuth } from '@workos-inc/authkit-nextjs/components';
import { useConvexAuth, useMutation, useQuery } from 'convex/react';
import { ArrowRight, LoaderCircle, Plus } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState, type FormEvent } from 'react';

import { api } from '../../../convex/_generated/api';

export function WorkspaceList() {
  const { user, loading: workosLoading } = useAuth();
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();
  const syncCurrentUser = useMutation(api.users.syncCurrent);
  const createWorkspace = useMutation(api.workspaces.create);
  const ensureJudgeWorkspace = useMutation(api.seed.ensureJudgeWorkspace);
  const assembleTeam = useMutation(api.teams.assembleRecommended);
  const workspaces = useQuery(api.workspaces.list, isAuthenticated ? { limit: 50 } : 'skip');
  const [title, setTitle] = useState('');
  const [creating, setCreating] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) return;
    void syncCurrentUser().catch(() => setError('Could not initialize Guild Cloud membership.'));
  }, [isAuthenticated, syncCurrentUser]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalized = title.trim();
    if (!normalized || creating) return;
    setCreating(true);
    setError(null);
    try {
      await createWorkspace({ title: normalized, boardMode: 'diagram' });
      setTitle('');
    } catch {
      setError('Could not create workspace. Try again.');
    } finally {
      setCreating(false);
    }
  }

  if (workosLoading || authLoading || (isAuthenticated && workspaces === undefined)) {
    return (
      <div className="workspace-list-state" aria-live="polite">
        <LoaderCircle className="spin" size={18} aria-hidden="true" /> Loading live workspaces…
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="workspace-list-state" role="alert">
        {user
          ? 'Guild Cloud could not validate this WorkOS session. Refresh this page to retry.'
          : 'Guild Cloud authentication did not connect. Refresh this page to retry.'}
      </div>
    );
  }

  return (
    <div className="workspace-list-shell">
      <form className="workspace-create-form" onSubmit={(event) => void submit(event)}>
        <label htmlFor="workspace-title">Create workspace</label>
        <div>
          <input
            id="workspace-title"
            value={title}
            maxLength={120}
            placeholder="e.g. Checkout redesign"
            onChange={(event) => setTitle(event.target.value)}
          />
          <button className="button button-dark" disabled={!title.trim() || creating} type="submit">
            {creating ? <LoaderCircle className="spin" size={16} /> : <Plus size={16} />}
            {creating ? 'Creating…' : 'Create'}
          </button>
          <button
            className="button"
            type="button"
            disabled={seeding}
            onClick={() => {
              setSeeding(true);
              setError(null);
              void ensureJudgeWorkspace()
                .then(async (result) => {
                  if (result.created) {
                    await assembleTeam({
                      workspaceId: result.workspaceId,
                      projectDescription: 'Guild judge evaluation workspace',
                    });
                  }
                })
                .catch(() => setError('Could not seed the judge workspace.'))
                .finally(() => setSeeding(false));
            }}
          >
            {seeding ? 'Seeding…' : 'Seed judge workspace'}
          </button>
        </div>
      </form>

      {error ? (
        <p className="workspace-list-error" role="alert">
          {error}
        </p>
      ) : null}

      {workspaces?.length ? (
        <ul className="workspace-list">
          {workspaces.map((workspace) => (
            <li key={workspace._id}>
              <Link href={`/workspaces/${workspace._id}`}>
                <span>
                  <strong>{workspace.title}</strong>
                  <small>
                    {workspace.boardMode} · {workspace.role}
                  </small>
                </span>
                <ArrowRight size={18} aria-hidden="true" />
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <div className="workspace-list-state">No workspaces yet. Create the first real canvas.</div>
      )}
    </div>
  );
}
