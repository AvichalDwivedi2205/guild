'use client';

import { useMutation, useQuery } from 'convex/react';
import { Check } from 'lucide-react';
import { useState } from 'react';

import { api } from '../../../convex/_generated/api';
import type { Id } from '../../../convex/_generated/dataModel';
import type { CanvasObject } from '@/domain/canvas';

export function ApproveButton({
  workspaceId,
  object,
}: {
  workspaceId: Id<'workspaces'>;
  object: CanvasObject;
}) {
  const approve = useMutation(api.designReview.approveDesignRevision);
  const designSetKey =
    typeof object.semantics.customFields?.designSetKey === 'string'
      ? object.semantics.customFields.designSetKey
      : null;
  const design = useQuery(
    api.design.getDesignSet,
    designSetKey ? { workspaceId, designSetKey } : 'skip',
  );
  const [error, setError] = useState<string | null>(null);
  const version = design?.headRevision?.version ?? 0;

  return (
    <span>
      <button
        type="button"
        aria-label="Approve"
        disabled={!designSetKey || version < 1}
        onClick={() => {
          if (!designSetKey || version < 1) return;
          setError(null);
          void approve({
            workspaceId,
            designSetKey,
            version,
            idempotencyKey: `approve:${designSetKey}:v${version}`,
          }).catch((caught: unknown) => {
            setError(caught instanceof Error ? caught.message : 'Approval failed.');
          });
        }}
      >
        <Check size={15} />
        Approve v{version || '?'}
      </button>
      {error ? <span>{error}</span> : null}
    </span>
  );
}
