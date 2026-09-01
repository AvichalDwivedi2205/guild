'use client';

import {
  BaseEdge,
  EdgeLabelRenderer,
  getSmoothStepPath,
  MarkerType,
  type EdgeProps,
} from '@xyflow/react';

import type { GuildFlowEdge } from '@/features/canvas/store';

import styles from './canvas.module.css';

export function ConnectorEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  selected,
}: EdgeProps<GuildFlowEdge>) {
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    borderRadius: 18,
  });
  const label = data?.edge.label || data?.edge.relationship;

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={MarkerType.ArrowClosed}
        className={styles.connectorPath}
        style={{ strokeWidth: selected ? 2.4 : 1.65 }}
        interactionWidth={24}
      />
      {label ? (
        <EdgeLabelRenderer>
          <span
            className={styles.connectorLabel}
            data-selected={selected || undefined}
            style={{ transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)` }}
          >
            {label.replaceAll('_', ' ')}
          </span>
        </EdgeLabelRenderer>
      ) : null}
    </>
  );
}

export const canvasEdgeTypes = { connector: ConnectorEdge } as const;
