'use client';

import { useAuth } from '@workos-inc/authkit-nextjs/components';
import { useConvexAuth, useMutation, useQuery } from 'convex/react';
import {
  ArrowRight,
  LayoutDashboard,
  LoaderCircle,
  LogOut,
  Plus,
  Search,
  Server,
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react';

import { signOutAction } from '@/app/auth/actions';
import { ThemeToggle } from '@/components/theme-toggle';
import { WORKSPACE_AUTH_TIMEOUT_MS } from '@/features/workspace/convex-authkit';

import { api } from '../../../convex/_generated/api';

function initials(name: string) {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('') || 'G'
  );
}

function WorkspaceShell({
  userName,
  userEmail,
  search,
  onSearch,
  children,
}: {
  userName: string;
  userEmail: string;
  search: string;
  onSearch: (search: string) => void;
  children: ReactNode;
}) {
  return (
    <main className="workspace-app">
      <aside className="workspace-sidebar">
        <Link className="guild-brand" href="/" aria-label="Guild home">
          <span className="guild-prism" aria-hidden="true" /> Guild
        </Link>
        <nav className="workspace-sidebar-nav" aria-label="Workspace navigation">
          <Link href="/workspaces" aria-current="page">
            <LayoutDashboard size={17} /> Workspaces
          </Link>
          <Link href="/runner/pair">
            <Server size={17} /> Pair Runner
          </Link>
        </nav>
        <div className="workspace-account">
          <span className="workspace-avatar">{initials(userName)}</span>
          <span>
            <strong>{userName}</strong>
            <small>{userEmail}</small>
          </span>
          <form action={signOutAction}>
            <button type="submit" aria-label="Sign out" title="Sign out">
              <LogOut size={16} />
            </button>
          </form>
        </div>
      </aside>
      <section className="workspace-main">
        <header className="workspace-topbar">
          <label className="workspace-search">
            <Search size={15} aria-hidden="true" />
            <input
              value={search}
              onChange={(event) => onSearch(event.target.value)}
              placeholder="Search workspaces"
              aria-label="Search workspaces"
            />
          </label>
          <ThemeToggle compact />
          <button
            className="guild-button guild-button-primary"
            type="button"
            onClick={() => document.getElementById('workspace-title')?.focus()}
          >
            <Plus size={14} /> New workspace
          </button>
        </header>
        {children}
      </section>
    </main>
  );
}

export function WorkspaceList({ userName, userEmail }: { userName: string; userEmail: string }) {
  const { user, loading: workosLoading } = useAuth();
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();
  const syncCurrentUser = useMutation(api.users.syncCurrent);
  const createWorkspace = useMutation(api.workspaces.create);
  const workspaces = useQuery(api.workspaces.list, isAuthenticated ? { limit: 50 } : 'skip');
  const [title, setTitle] = useState('');
  const [search, setSearch] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timedOut, setTimedOut] = useState(false);
  const waiting = workosLoading || authLoading || (isAuthenticated && workspaces === undefined);
  const visibleWorkspaces = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return workspaces ?? [];
    return (workspaces ?? []).filter((workspace) => workspace.title.toLowerCase().includes(query));
  }, [search, workspaces]);

  useEffect(() => {
    if (!isAuthenticated) return;
    void syncCurrentUser().catch(() => setError('Could not initialize Guild Cloud membership.'));
  }, [isAuthenticated, syncCurrentUser]);

  useEffect(() => {
    if (!waiting) return;
    const timeout = window.setTimeout(() => setTimedOut(true), WORKSPACE_AUTH_TIMEOUT_MS);
    return () => window.clearTimeout(timeout);
  }, [waiting]);

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

  let content: ReactNode;
  if (waiting && !timedOut) {
    content = (
      <div className="workspace-list-state" aria-live="polite">
        <LoaderCircle className="spin" size={18} aria-hidden="true" /> Loading live workspaces…
      </div>
    );
  } else if (!isAuthenticated || (timedOut && waiting)) {
    content = (
      <div className="workspace-list-state" role="alert">
        {user
          ? 'Guild Cloud could not validate this WorkOS session. Refresh this page to retry.'
          : 'Guild Cloud authentication did not connect. Refresh this page to retry.'}
      </div>
    );
  } else {
    content = (
      <>
        <section className="workspace-welcome">
          <span>YOUR PROJECT SPACES</span>
          <h1>What are you building?</h1>
          <p>
            Every project is one durable Workspace and one infinite canvas. Create it here, then
            assemble Role Profiles and start a Team Run when your local Runner is ready.
          </p>
        </section>

        <section className="workspace-start-card glass-surface">
          <h2>Create a Workspace</h2>
          <p>Name the project. Guild opens a clean canvas; no template or fake run is inserted.</p>
          <form className="workspace-create-form" onSubmit={(event) => void submit(event)}>
            <label htmlFor="workspace-title">Workspace name</label>
            <div>
              <input
                id="workspace-title"
                value={title}
                maxLength={120}
                placeholder="e.g. Usage-based billing"
                onChange={(event) => setTitle(event.target.value)}
              />
              <button
                className="guild-button guild-button-primary"
                disabled={!title.trim() || creating}
                type="submit"
              >
                {creating ? <LoaderCircle className="spin" size={16} /> : <Plus size={16} />}
                {creating ? 'Creating…' : 'Create workspace'}
              </button>
            </div>
          </form>
          {error ? (
            <p className="workspace-list-error" role="alert">
              {error}
            </p>
          ) : null}
        </section>

        <div className="workspace-section-heading">
          <h2>Workspaces</h2>
          <span>{visibleWorkspaces.length} visible</span>
        </div>

        {visibleWorkspaces.length ? (
          <ul className="workspace-list">
            {visibleWorkspaces.map((workspace) => (
              <li key={workspace._id}>
                <Link
                  className="workspace-card glass-surface"
                  href={`/workspaces/${workspace._id}`}
                >
                  <div className="workspace-card-preview" aria-hidden="true">
                    <span />
                    <span />
                    <span />
                    <span />
                  </div>
                  <div className="workspace-card-body">
                    <strong>{workspace.title}</strong>
                    <small>
                      {workspace.boardMode} · {workspace.role}
                    </small>
                    <ArrowRight size={17} aria-hidden="true" />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <div className="workspace-list-state">
            {search.trim()
              ? 'No Workspace matches that search.'
              : 'No Workspaces yet. Create the first real project canvas.'}
          </div>
        )}
      </>
    );
  }

  return (
    <WorkspaceShell userName={userName} userEmail={userEmail} search={search} onSearch={setSearch}>
      {content}
    </WorkspaceShell>
  );
}
