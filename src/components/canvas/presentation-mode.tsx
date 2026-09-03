'use client';

import { useMutation, useQuery } from 'convex/react';
import { useEffect, useState } from 'react';
import { useReactFlow } from '@xyflow/react';

import { api } from '../../../convex/_generated/api';
import type { Id } from '../../../convex/_generated/dataModel';
import { useCanvasInteractionStore } from '@/features/canvas/store';

export function PresentationMode({ workspaceId }: { workspaceId: Id<'workspaces'> }) {
  const views = useQuery(api.demoScenario.listPresentationViews, { workspaceId });
  const runs = useQuery(api.runs.list, { workspaceId, limit: 25 });
  const saveView = useMutation(api.demoScenario.savePresentationView);
  const { fitView, getNode, getViewport, setViewport } = useReactFlow();
  const [active, setActive] = useState(false);
  const [followWorker, setFollowWorker] = useState(false);
  const [index, setIndex] = useState(0);
  const reducedMotion =
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  useEffect(() => {
    if (!active) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setActive(false);
        setFollowWorker(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [active]);

  const current = views?.[index];
  const activeTargetObjectId = runs
    ?.flatMap((row) => row.jobs)
    .find(
      (job) => (job.state === 'leased' || job.state === 'running') && Boolean(job.targetSectionId),
    )?.targetSectionId;

  useEffect(() => {
    if (!active || !followWorker || !activeTargetObjectId) return;
    const node = getNode(activeTargetObjectId);
    if (!node) return;
    void fitView({ nodes: [node], padding: 0.22, duration: reducedMotion ? 0 : 400 });
  }, [active, activeTargetObjectId, fitView, followWorker, getNode, reducedMotion]);

  return (
    <div data-presentation={active || undefined} data-follow-worker={followWorker || undefined}>
      <button type="button" onClick={() => setActive((value) => !value)}>
        {active ? 'Exit presentation' : 'Present'}
      </button>
      {active ? (
        <>
          <button
            type="button"
            onClick={() => {
              const previous = views?.[index - 1];
              if (!previous) return;
              setIndex(index - 1);
              void setViewport(previous.camera, { duration: reducedMotion ? 0 : 400 });
            }}
            disabled={index <= 0}
          >
            Previous view
          </button>
          <button
            type="button"
            onClick={() => {
              const next = views?.[index + 1];
              if (!next) return;
              setIndex(index + 1);
              void setViewport(next.camera, { duration: reducedMotion ? 0 : 400 });
            }}
            disabled={!views || index >= views.length - 1}
          >
            Next view
          </button>
          <label>
            <input
              type="checkbox"
              checked={followWorker}
              onChange={(event) => setFollowWorker(event.target.checked)}
            />
            Follow Worker
          </label>
          <button
            type="button"
            onClick={() => {
              const camera = getViewport();
              void saveView({
                workspaceId,
                key: `view-${Date.now()}`,
                name: current?.name ?? `View ${(views?.length ?? 0) + 1}`,
                order: views?.length ?? 0,
                camera,
                focusKind: 'canvas',
              });
            }}
          >
            Save camera
          </button>
          {followWorker ? (
            <p>
              {activeTargetObjectId
                ? 'Following the active Job target.'
                : 'Waiting for an active Job with a canvas target.'}
            </p>
          ) : null}
          <p>{useCanvasInteractionStore.getState().selectedNodeIds.length} selected</p>
        </>
      ) : null}
    </div>
  );
}
