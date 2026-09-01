'use client';

import { useConvexAuth, useMutation, useQuery } from 'convex/react';
import { CheckCircle2, LoaderCircle, Server } from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';

import { api } from '../../../convex/_generated/api';
import type { Id } from '../../../convex/_generated/dataModel';

export function PairRunner({ initialCode }: { initialCode: string }) {
  const { isAuthenticated } = useConvexAuth();
  const syncCurrentUser = useMutation(api.users.syncCurrent);
  const approvePairing = useMutation(api.runners.approvePairing);
  const workspaces = useQuery(api.workspaces.list, isAuthenticated ? { limit: 100 } : 'skip');
  const [code, setCode] = useState(initialCode.toUpperCase());
  const [selected, setSelected] = useState<Set<string> | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [approved, setApproved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) return;
    void syncCurrentUser().catch(() => setError('Could not initialize Guild Cloud identity.'));
  }, [isAuthenticated, syncCurrentUser]);

  const effectiveSelected =
    selected ?? new Set(workspaces?.map((workspace) => workspace._id) ?? []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!code.trim() || effectiveSelected.size === 0 || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      await approvePairing({
        userCode: code.trim().toUpperCase(),
        allowedWorkspaceIds: [...effectiveSelected].map((id) => id as Id<'workspaces'>),
      });
      setApproved(true);
    } catch {
      setError('Pairing code is invalid, expired, or already used. Start pairing again on Runner.');
    } finally {
      setSubmitting(false);
    }
  }

  if (approved) {
    return (
      <div className="workspace-list-state" role="status">
        <CheckCircle2 size={20} aria-hidden="true" /> Runner approved. Return to terminal; token
        exchange continues automatically.
      </div>
    );
  }

  return (
    <form className="workspace-create-form" onSubmit={(event) => void submit(event)}>
      <label htmlFor="runner-code">Pairing code</label>
      <div>
        <input
          id="runner-code"
          value={code}
          maxLength={32}
          autoComplete="one-time-code"
          onChange={(event) => setCode(event.target.value.toUpperCase())}
        />
      </div>
      <fieldset className="runner-workspace-grants">
        <legend>Allow Runner to work in</legend>
        {workspaces === undefined ? (
          <span className="workspace-list-state">
            <LoaderCircle className="spin" size={16} /> Loading workspaces…
          </span>
        ) : workspaces.length === 0 ? (
          <span className="workspace-list-state">Create a workspace before pairing Runner.</span>
        ) : (
          workspaces.map((workspace) => (
            <label key={workspace._id}>
              <input
                type="checkbox"
                checked={effectiveSelected.has(workspace._id)}
                onChange={(event) =>
                  setSelected((current) => {
                    const next = new Set(current ?? effectiveSelected);
                    if (event.target.checked) next.add(workspace._id);
                    else next.delete(workspace._id);
                    return next;
                  })
                }
              />
              <span>
                <strong>{workspace.title}</strong>
                <small>{workspace.role}</small>
              </span>
            </label>
          ))
        )}
      </fieldset>
      {error ? (
        <p className="workspace-list-error" role="alert">
          {error}
        </p>
      ) : null}
      <button
        className="button button-dark"
        type="submit"
        disabled={!code.trim() || effectiveSelected.size === 0 || submitting}
      >
        {submitting ? <LoaderCircle className="spin" size={16} /> : <Server size={16} />}
        {submitting ? 'Approving…' : 'Approve Runner'}
      </button>
    </form>
  );
}
