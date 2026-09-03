'use client';

import {
  Box,
  CircleDashed,
  Columns3,
  Component,
  Diamond,
  Frame,
  Image as ImageIcon,
  LayoutList,
  Link,
  ListChecks,
  MessageSquare,
  MessageSquarePlus,
  MousePointer2,
  Network,
  PanelTop,
  Pencil,
  Rows3,
  Shapes,
  StickyNote,
  Table2,
  Type,
} from 'lucide-react';
import { useReactFlow } from '@xyflow/react';
import { useState, type ReactNode } from 'react';

import { projectRelationships, type BoardMode, type CanvasObjectType } from '@/domain/canvas';
import { canvasNodeRegistry, nodeDefinitionsForMode } from '@/features/canvas/registry';
import { useCanvasInteractionStore } from '@/features/canvas/store';
import type { CanvasWorkspaceActions } from '@/features/canvas/types';

import styles from './canvas.module.css';

const modes: { id: BoardMode; label: string }[] = [
  { id: 'diagram', label: 'Diagram' },
  { id: 'task', label: 'Task' },
  { id: 'wireframe', label: 'Wireframe' },
];

function nodeIcon(type: CanvasObjectType): ReactNode {
  const iconProps = { size: 17, strokeWidth: 1.8 };
  switch (type) {
    case 'shape':
      return <Shapes {...iconProps} />;
    case 'sticky':
      return <StickyNote {...iconProps} />;
    case 'text':
      return <Type {...iconProps} />;
    case 'mindMapNode':
      return <Network {...iconProps} />;
    case 'table':
      return <Table2 {...iconProps} />;
    case 'icon':
      return <Diamond {...iconProps} />;
    case 'image':
      return <ImageIcon {...iconProps} />;
    case 'link':
      return <Link {...iconProps} />;
    case 'section':
      return <Box {...iconProps} />;
    case 'annotation':
      return <MessageSquare {...iconProps} />;
    case 'drawing':
      return <Pencil {...iconProps} />;
    case 'task':
      return <ListChecks {...iconProps} />;
    case 'stack':
      return <Columns3 {...iconProps} />;
    case 'wireframeFrame':
      return <Frame {...iconProps} />;
    case 'wireframeComponent':
      return <Component {...iconProps} />;
  }
}

export function CanvasCreationToolbar({ actions }: { actions: CanvasWorkspaceActions }) {
  const mode = useCanvasInteractionStore((state) => state.mode);
  const tool = useCanvasInteractionStore((state) => state.tool);
  const setMode = useCanvasInteractionStore((state) => state.setMode);
  const setTool = useCanvasInteractionStore((state) => state.setTool);
  const connectorRelationship = useCanvasInteractionStore((state) => state.connectorRelationship);
  const setConnectorRelationship = useCanvasInteractionStore(
    (state) => state.setConnectorRelationship,
  );
  const { screenToFlowPosition } = useReactFlow();
  const [creatingType, setCreatingType] = useState<CanvasObjectType | null>(null);

  const createObject = async (type: CanvasObjectType) => {
    if (!actions.createObject || creatingType) return;
    const definition = canvasNodeRegistry[type];
    const position = screenToFlowPosition({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
    setCreatingType(type);
    try {
      await actions.createObject({ type, position, size: definition.defaultSize });
    } finally {
      setCreatingType(null);
    }
  };

  return (
    <aside className={styles.creationToolbar} aria-label="Canvas creation toolbar">
      <div className={styles.modeSwitcher} aria-label="Creation mode">
        {modes.map((item) => (
          <button
            key={item.id}
            type="button"
            aria-pressed={mode === item.id}
            onClick={() => {
              setMode(item.id);
              void actions.setBoardMode?.(item.id);
            }}
          >
            {item.label}
          </button>
        ))}
      </div>
      <div className={styles.primaryTools} aria-label="Interaction tools">
        <button
          type="button"
          data-active={tool === 'annotate' || undefined}
          onClick={() => setTool('annotate')}
          aria-label="Annotate canvas (A)"
          title="Annotate canvas (A)"
        >
          <MessageSquarePlus size={18} />
          <span>Annotate</span>
        </button>
        <button
          type="button"
          data-active={tool === 'select' || undefined}
          onClick={() => setTool('select')}
          aria-label="Select and move (V)"
          title="Select and move (V)"
        >
          <MousePointer2 size={18} />
          <span>Select</span>
        </button>
        <button
          type="button"
          data-active={tool === 'pan' || undefined}
          onClick={() => setTool('pan')}
          aria-label="Pan canvas (H or Space)"
          title="Pan canvas (H or Space)"
        >
          <CircleDashed size={18} />
          <span>Pan</span>
        </button>
        <button
          type="button"
          data-active={tool === 'connect' || undefined}
          onClick={() => setTool('connect')}
          aria-label="Connect objects (L)"
          title="Connect objects (L)"
        >
          <Network size={18} />
          <span>Connect</span>
        </button>
      </div>
      <div className={styles.toolDivider} />
      {tool === 'connect' ? (
        <label className={styles.connectorControl}>
          <span>Relationship</span>
          <select
            aria-label="Connector relationship"
            value={connectorRelationship}
            onChange={(event) =>
              setConnectorRelationship(event.target.value as (typeof projectRelationships)[number])
            }
          >
            {projectRelationships.map((relationship) => (
              <option key={relationship} value={relationship}>
                {relationship.replaceAll('_', ' ')}
              </option>
            ))}
          </select>
        </label>
      ) : null}
      <div className={styles.nodeTools} aria-label={`${mode} objects`}>
        {nodeDefinitionsForMode(mode).map((definition) => (
          <button
            key={definition.type}
            type="button"
            disabled={!actions.createObject || creatingType !== null}
            aria-label={`Create ${definition.label}`}
            title={actions.createObject ? `Create ${definition.label}` : 'Editing unavailable'}
            onClick={() => void createObject(definition.type)}
          >
            {nodeIcon(definition.type)}
            <span>{creatingType === definition.type ? 'Creating…' : definition.label}</span>
          </button>
        ))}
      </div>
      {!actions.createObject ? (
        <p className={styles.toolbarNotice}>Read-only until workspace connection is ready.</p>
      ) : null}
    </aside>
  );
}

export function ToolbarModeIcon({ mode }: { mode: BoardMode }) {
  if (mode === 'task') return <Rows3 size={15} />;
  if (mode === 'wireframe') return <PanelTop size={15} />;
  return <LayoutList size={15} />;
}
