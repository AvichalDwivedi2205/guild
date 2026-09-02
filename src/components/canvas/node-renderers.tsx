'use client';

import {
  CircleDot,
  ExternalLink,
  FileImage,
  Globe2,
  Image as ImageIcon,
  LockKeyhole,
  Shapes,
} from 'lucide-react';
import { Handle, NodeResizer, Position, type NodeProps, type ResizeParams } from '@xyflow/react';
import { type CSSProperties, type ReactNode, useEffect, useRef, useState } from 'react';

import type { CanvasObject } from '@/domain/canvas';
import { type GuildFlowNode, useCanvasInteractionStore } from '@/features/canvas/store';

import styles from './canvas.module.css';

function stringField(value: unknown, key: string): string | null {
  if (!value || typeof value !== 'object') return null;
  const field = Reflect.get(value, key);
  return typeof field === 'string' ? field : null;
}

function stringArrayField(value: unknown, key: string): string[] {
  if (!value || typeof value !== 'object') return [];
  const field = Reflect.get(value, key);
  return Array.isArray(field)
    ? field.filter((item): item is string => typeof item === 'string')
    : [];
}

function contentText(object: CanvasObject): string | null {
  if (typeof object.content === 'string') return object.content;
  return stringField(object.content, 'text') ?? stringField(object.content, 'description');
}

function styleValue(object: CanvasObject, key: string): string | undefined {
  const value = object.style[key];
  return typeof value === 'string' ? value : undefined;
}

function NodeChrome({
  object,
  selected,
  children,
  family,
  onDoubleClick,
}: {
  object: CanvasObject;
  selected: boolean;
  children: ReactNode;
  family: string;
  onDoubleClick?: () => void;
}) {
  const beginInteraction = useCanvasInteractionStore((state) => state.beginInteraction);
  const finishInteraction = useCanvasInteractionStore((state) => state.finishInteraction);
  const persistResize = useCanvasInteractionStore((state) => state.actions.persistResize);
  const fill = styleValue(object, 'fill');
  const color = styleValue(object, 'color');
  const borderColor = styleValue(object, 'borderColor');
  const nodeStyle: CSSProperties = {
    ...(fill ? { backgroundColor: fill } : {}),
    ...(color ? { color } : {}),
    ...(borderColor ? { borderColor } : {}),
  };

  const finishResize = (_event: unknown, params: ResizeParams) => {
    finishInteraction(object.id);
    void persistResize?.({
      objectId: object.id,
      size: { width: params.width, height: params.height },
      expectedGeometryRevision: object.revisions.geometry,
    });
  };

  return (
    <article
      className={styles.node}
      data-family={family}
      data-node-type={object.type}
      data-variant={object.variant ?? 'default'}
      data-selected={selected || undefined}
      data-locked={object.locked || undefined}
      style={nodeStyle}
      aria-label={`${object.title || object.type} canvas object`}
      title={onDoubleClick ? 'Double-click to edit' : undefined}
      onDoubleClick={
        onDoubleClick
          ? (event) => {
              event.stopPropagation();
              onDoubleClick();
            }
          : undefined
      }
    >
      <NodeResizer
        isVisible={selected && !object.locked}
        minWidth={object.type === 'icon' ? 56 : 120}
        minHeight={object.type === 'icon' ? 56 : 64}
        color="#5d46e8"
        onResizeStart={() => beginInteraction(object.id)}
        onResizeEnd={finishResize}
      />
      <Handle
        className={styles.handle}
        type="target"
        position={Position.Left}
        aria-label={`Connect into ${object.title || object.type}`}
      />
      <Handle
        className={styles.handle}
        type="source"
        position={Position.Right}
        aria-label={`Connect from ${object.title || object.type}`}
      />
      {object.locked ? (
        <LockKeyhole className={styles.lockIcon} aria-label="Locked" size={13} />
      ) : null}
      {children}
    </article>
  );
}

function NodeTitle({ object, fallback }: { object: CanvasObject; fallback: string }) {
  return <h3 className={styles.nodeTitle}>{object.title?.trim() || fallback}</h3>;
}

function InlineTextNode({ object, selected }: { object: CanvasObject; selected: boolean }) {
  const updateContent = useCanvasInteractionStore((state) => state.actions.updateContent);
  const persistedText = contentText(object) || object.title?.trim() || 'Text';
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(persistedText);
  const [optimisticText, setOptimisticText] = useState<{
    text: string;
    revision: number;
  } | null>(null);
  const editorRef = useRef<HTMLTextAreaElement | null>(null);
  const visibleText =
    optimisticText && object.revisions.content < optimisticText.revision
      ? optimisticText.text
      : persistedText;

  useEffect(() => {
    if (!editing) return;
    editorRef.current?.focus();
    editorRef.current?.select();
  }, [editing]);

  const commit = async () => {
    const nextText = draft.trim();
    if (!nextText || nextText === visibleText || !updateContent) {
      setDraft(visibleText);
      setEditing(false);
      return;
    }
    const result = await updateContent({
      objectId: object.id,
      title: nextText,
      content: { text: nextText },
      expectedContentRevision: object.revisions.content,
    });
    if (!result.ok) return;
    setOptimisticText({ text: nextText, revision: result.revision });
    setEditing(false);
  };

  if (editing) {
    return (
      <NodeChrome object={object} selected={selected} family="diagram">
        <textarea
          ref={editorRef}
          className={`${styles.inlineTextEditor} nodrag nowheel`}
          aria-label={`Edit ${object.title?.trim() || 'text'}`}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onBlur={() => void commit()}
          onKeyDown={(event) => {
            if (event.key === 'Escape') {
              event.preventDefault();
              setDraft(visibleText);
              setEditing(false);
            }
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault();
              void commit();
            }
          }}
          onPointerDown={(event) => event.stopPropagation()}
        />
      </NodeChrome>
    );
  }

  return (
    <NodeChrome
      object={object}
      selected={selected}
      family="diagram"
      onDoubleClick={() => {
        setDraft(visibleText);
        setEditing(true);
      }}
    >
      <p className={styles.textNode}>{visibleText}</p>
    </NodeChrome>
  );
}

export function DiagramNodeRenderer({ data, selected }: NodeProps<GuildFlowNode>) {
  const { object } = data;
  if (object.type === 'text') return <InlineTextNode object={object} selected={selected} />;
  const body = contentText(object);
  return (
    <NodeChrome object={object} selected={selected} family="diagram">
      <div className={styles.nodeKicker}>
        {object.type === 'sticky'
          ? 'Note'
          : object.type === 'annotation'
            ? 'Annotation'
            : object.semantics.semanticType || object.type}
      </div>
      <NodeTitle
        object={object}
        fallback={object.type === 'mindMapNode' ? 'Mind map idea' : 'Untitled shape'}
      />
      {body ? <p className={styles.nodeBody}>{body}</p> : null}
    </NodeChrome>
  );
}

function TablePreview({ object }: { object: CanvasObject }) {
  const rows = stringArrayField(object.content, 'rows');
  const visibleRows = rows.length > 0 ? rows.slice(0, 4) : ['Column A  ·  Column B', 'No rows yet'];
  return (
    <div className={styles.tablePreview}>
      {visibleRows.map((row, index) => (
        <div key={`${row}-${index}`} data-header={index === 0 || undefined}>
          {row}
        </div>
      ))}
    </div>
  );
}

function TaskPreview({ object }: { object: CanvasObject }) {
  const checklist = stringArrayField(object.content, 'checklist');
  return (
    <>
      <div className={styles.taskMeta}>
        <span>{object.semantics.status || 'No status'}</span>
        <span>{object.semantics.priority || 'No priority'}</span>
      </div>
      {checklist.slice(0, 3).map((item) => (
        <div className={styles.checkItem} key={item}>
          <span /> {item}
        </div>
      ))}
    </>
  );
}

export function StructuredNodeRenderer({ data, selected }: NodeProps<GuildFlowNode>) {
  const { object } = data;
  return (
    <NodeChrome object={object} selected={selected} family="structured">
      <div className={styles.nodeKicker}>{object.semantics.semanticType || object.type}</div>
      <NodeTitle
        object={object}
        fallback={object.type === 'task' ? 'Untitled task' : 'Untitled table'}
      />
      {object.type === 'table' ? <TablePreview object={object} /> : <TaskPreview object={object} />}
    </NodeChrome>
  );
}

function safeHostname(value: string | null) {
  if (!value) return null;
  try {
    return new URL(value).hostname;
  } catch {
    return value;
  }
}

export function MediaNodeRenderer({ data, selected }: NodeProps<GuildFlowNode>) {
  const { object } = data;
  const url =
    typeof object.content === 'string' ? object.content : stringField(object.content, 'url');
  return (
    <NodeChrome object={object} selected={selected} family="media">
      {object.type === 'icon' ? (
        <div className={styles.mediaIcon} aria-hidden="true">
          <Shapes size={34} strokeWidth={1.6} />
        </div>
      ) : object.type === 'image' ? (
        url ? (
          // eslint-disable-next-line @next/next/no-img-element -- user-authored canvas URLs are not known at build time.
          <img className={styles.mediaImage} src={url} alt={object.title || 'Canvas image'} />
        ) : (
          <div className={styles.mediaPlaceholder}>
            <ImageIcon size={28} />
            <span>No image attached</span>
          </div>
        )
      ) : (
        <div className={styles.linkPreview}>
          <div className={styles.linkIcon}>
            <Globe2 size={18} />
          </div>
          <div>
            <NodeTitle object={object} fallback="Untitled link" />
            <span>{safeHostname(url) || 'No URL attached'}</span>
          </div>
          <ExternalLink size={14} aria-hidden="true" />
        </div>
      )}
    </NodeChrome>
  );
}

export function ContainerNodeRenderer({ data, selected }: NodeProps<GuildFlowNode>) {
  const { object } = data;
  return (
    <NodeChrome object={object} selected={selected} family="container">
      <div className={styles.containerHeader}>
        <span>
          {object.type === 'stack' ? 'Task stack' : object.semantics.projectArea || 'Section'}
        </span>
        <NodeTitle
          object={object}
          fallback={object.type === 'stack' ? 'Untitled stack' : 'Untitled section'}
        />
      </div>
      <div className={styles.containerEmpty}>Drop objects here</div>
    </NodeChrome>
  );
}

function WireframeGlyph({ variant }: { variant: string | undefined }) {
  if (variant === 'button') return <div className={styles.wireButton}>Button</div>;
  if (variant === 'checkbox') {
    return (
      <div className={styles.wireCheckbox}>
        <span />
        <span>Checkbox</span>
      </div>
    );
  }
  if (variant === 'avatar') return <div className={styles.wireAvatar} />;
  return (
    <div className={styles.wireInput}>
      <span>{variant || 'Component'}</span>
    </div>
  );
}

export function WireframeNodeRenderer({ data, selected }: NodeProps<GuildFlowNode>) {
  const { object } = data;
  const isFrame = object.type === 'wireframeFrame';
  return (
    <NodeChrome object={object} selected={selected} family="wireframe">
      {isFrame ? (
        <>
          <div className={styles.frameBar}>
            <span /> <span /> <span />
          </div>
          <div className={styles.frameTitle}>
            <NodeTitle object={object} fallback={`${object.variant || 'Browser'} frame`} />
          </div>
          <div className={styles.frameCanvas}>
            <FileImage size={28} />
            <span>Place components inside frame</span>
          </div>
        </>
      ) : (
        <WireframeGlyph variant={object.variant} />
      )}
    </NodeChrome>
  );
}

type DrawingPoint = { x: number; y: number };

function drawingPoints(content: unknown): DrawingPoint[] {
  if (!content || typeof content !== 'object') return [];
  const points = Reflect.get(content, 'points');
  if (!Array.isArray(points)) return [];
  return points.filter((point): point is DrawingPoint => {
    if (!point || typeof point !== 'object') return false;
    return (
      typeof Reflect.get(point, 'x') === 'number' && typeof Reflect.get(point, 'y') === 'number'
    );
  });
}

export function DrawingNodeRenderer({ data, selected }: NodeProps<GuildFlowNode>) {
  const { object } = data;
  const points = drawingPoints(object.content);
  const path = points
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
    .join(' ');
  return (
    <NodeChrome object={object} selected={selected} family="drawing">
      {path ? (
        <svg
          className={styles.drawing}
          viewBox={`0 0 ${object.size.width} ${object.size.height}`}
          role="img"
          aria-label={object.title || 'Freehand drawing'}
        >
          <path
            d={path}
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="3"
          />
        </svg>
      ) : (
        <div className={styles.mediaPlaceholder}>
          <CircleDot size={26} />
          <span>Empty drawing</span>
        </div>
      )}
    </NodeChrome>
  );
}

export const canvasNodeTypes = {
  shape: DiagramNodeRenderer,
  sticky: DiagramNodeRenderer,
  text: DiagramNodeRenderer,
  mindMapNode: DiagramNodeRenderer,
  table: StructuredNodeRenderer,
  icon: MediaNodeRenderer,
  image: MediaNodeRenderer,
  link: MediaNodeRenderer,
  section: ContainerNodeRenderer,
  annotation: DiagramNodeRenderer,
  drawing: DrawingNodeRenderer,
  task: StructuredNodeRenderer,
  stack: ContainerNodeRenderer,
  wireframeFrame: WireframeNodeRenderer,
  wireframeComponent: WireframeNodeRenderer,
} as const;
