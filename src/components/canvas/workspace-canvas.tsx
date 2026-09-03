'use client';

import {
  Background,
  BackgroundVariant,
  MiniMap,
  Panel,
  ReactFlow,
  ReactFlowProvider,
  ViewportPortal,
  useReactFlow,
  type Connection,
  type OnNodeDrag,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import {
  Bot,
  ChevronDown,
  CloudOff,
  Focus,
  Hand,
  MessageSquare,
  Minus,
  MousePointer2,
  MessageSquarePlus,
  Play,
  Plus,
  Redo2,
  RefreshCcw,
  Server,
  Undo2,
  Users,
  Wifi,
} from 'lucide-react';
import Link from 'next/link';
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
} from 'react';

import { ThemeToggle } from '@/components/theme-toggle';
import type { CanvasObject } from '@/domain/canvas';
import { NODE_PALETTE, resolvePaletteId } from '@/domain/palette';
import { absoluteObjectRectangle } from '@/domain/geometry';
import { primaryAction } from '@/features/canvas/action-registry';
import { AgentDock, AgentEngineIcon } from '@/components/canvas/agent-dock';
import { PresentationMode } from '@/components/canvas/presentation-mode';
import { CanvasCreationToolbar, ToolbarModeIcon } from '@/components/canvas/canvas-toolbar';
import { canvasEdgeTypes } from '@/components/canvas/connector-edge';
import { ExpandedObjectDialog } from '@/components/canvas/expanded-object-dialog';
import { canvasNodeTypes } from '@/components/canvas/node-renderers';
import { CanvasRightPanel, type CanvasPanel } from '@/components/canvas/canvas-panels';
import { SelectionToolbar } from '@/components/canvas/selection-toolbar';
import { type GuildFlowNode, useCanvasInteractionStore } from '@/features/canvas/store';
import { useFeedbackStore } from '@/features/feedback/store';
import type {
  CanvasCollaborator,
  CanvasWorkspaceActions,
  CanvasWorkspaceData,
} from '@/features/canvas/types';
import type { WebMcpRegistrationState } from '@/features/webmcp/webmcp-tools';

import styles from './canvas.module.css';

function isEditableTarget(target: EventTarget | null) {
  return (
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement ||
    (target instanceof HTMLElement && target.isContentEditable)
  );
}

function clampUnit(value: number) {
  return Math.max(0, Math.min(1, value));
}

function statusLabel(status: CanvasWorkspaceData['status']) {
  const labels = {
    loading: 'Loading workspace',
    ready: 'Live',
    offline: 'Offline',
    reconnecting: 'Reconnecting',
    error: 'Connection error',
    conflict: 'Edit conflict',
  } as const;
  return labels[status];
}

function TopToolbar({
  data,
  actions,
  panel,
  setPanel,
}: {
  data: CanvasWorkspaceData;
  actions: CanvasWorkspaceActions;
  panel: CanvasPanel | null;
  setPanel: (panel: CanvasPanel | null) => void;
}) {
  const mode = useCanvasInteractionStore((state) => state.mode);
  const tool = useCanvasInteractionStore((state) => state.tool);
  const { fitView, zoomIn, zoomOut, getZoom } = useReactFlow();
  const [zoom, setZoom] = useState(() => Math.round(getZoom() * 100));
  const activeRunner = data.runners.find(
    (runner) => runner.status === 'online' || runner.status === 'busy',
  );

  return (
    <header className={styles.topbar}>
      <div className={styles.workspaceIdentity}>
        <Link href="/workspaces" aria-label="Back to workspaces" className={styles.guildMark}>
          G
        </Link>
        <div>
          <span>Workspace</span>
          <strong>{data.workspaceTitle}</strong>
        </div>
        <ChevronDown size={14} aria-hidden="true" />
      </div>
      <div className={styles.topbarCenter}>
        <span className={styles.modePill}>
          <ToolbarModeIcon mode={mode} /> {mode}
        </span>
        <span className={styles.toolPill}>
          {tool === 'pan' ? (
            <Hand size={14} />
          ) : tool === 'annotate' ? (
            <MessageSquarePlus size={14} />
          ) : (
            <MousePointer2 size={14} />
          )}{' '}
          {tool}
        </span>
        <div className={styles.historyControls}>
          <button
            type="button"
            disabled={!actions.undo}
            onClick={() => void actions.undo?.()}
            aria-label="Undo (Command Z)"
            title="Undo (⌘Z)"
          >
            <Undo2 size={16} />
          </button>
          <button type="button" disabled aria-label="Redo unavailable" title="Redo unavailable">
            <Redo2 size={16} />
          </button>
        </div>
        <div className={styles.zoomControls}>
          <button
            type="button"
            onClick={() => {
              void zoomOut();
              setZoom(Math.round(getZoom() * 100));
            }}
            aria-label="Zoom out"
          >
            <Minus size={15} />
          </button>
          <button
            type="button"
            onClick={() => {
              void fitView({ padding: 0.15, duration: 220 });
              setTimeout(() => setZoom(Math.round(getZoom() * 100)), 240);
            }}
            aria-label="Fit canvas to view"
            title="Fit to view (1)"
          >
            <Focus size={15} />
            <span>{zoom}%</span>
          </button>
          <button
            type="button"
            onClick={() => {
              void zoomIn();
              setZoom(Math.round(getZoom() * 100));
            }}
            aria-label="Zoom in"
          >
            <Plus size={15} />
          </button>
        </div>
      </div>
      <div className={styles.topbarActions}>
        <div
          className={styles.collaboratorStack}
          aria-label={`${data.collaborators.length} collaborators`}
        >
          {data.collaborators.slice(0, 4).map((collaborator) => (
            <span
              key={collaborator.id}
              style={{ background: collaborator.color }}
              title={`${collaborator.name} · ${collaborator.state}`}
            >
              {collaborator.initials}
            </span>
          ))}
          {data.collaborators.length > 4 ? <span>+{data.collaborators.length - 4}</span> : null}
        </div>
        <ThemeToggle compact />
        <button
          className={styles.runnerButton}
          type="button"
          onClick={() => setPanel(panel === 'runner' ? null : 'runner')}
          data-online={Boolean(activeRunner) || undefined}
        >
          <Server size={15} />
          {activeRunner
            ? `${activeRunner.activeJobs}/${activeRunner.configuredConcurrency} active`
            : 'Runner offline'}
        </button>
        <button
          className={styles.commentsButton}
          type="button"
          onClick={() => setPanel(panel === 'comments' ? null : 'comments')}
          aria-label="Open comments"
        >
          <MessageSquare size={16} />
          {data.comments.filter((comment) => comment.state !== 'resolved').length || null}
        </button>
        <button
          className={styles.runTeamButton}
          type="button"
          disabled={data.roleProfiles.length === 0}
          onClick={() => setPanel('team')}
        >
          <Play size={14} fill="currentColor" /> Run Team
        </button>
      </div>
    </header>
  );
}

function LoadingOverlay() {
  return (
    <div className={styles.canvasStateOverlay} aria-busy="true" aria-label="Loading canvas">
      <div className={styles.canvasSkeleton}>
        <span />
        <span />
        <span />
        <p>Loading shared canvas…</p>
      </div>
    </div>
  );
}

function EmptyOverlay({ actions }: { actions: CanvasWorkspaceActions }) {
  return (
    <div className={styles.canvasStateOverlay}>
      <div className={styles.emptyCanvasCard}>
        <div className={styles.emptyCanvasIcon}>
          <Users size={24} />
        </div>
        <h2>Start shaping this project</h2>
        <p>
          Create one object on shared canvas. Diagram, Task, and Wireframe modes all use same
          workspace.
        </p>
        <div>
          <button
            type="button"
            disabled={!actions.createObject}
            onClick={() =>
              void actions.createObject?.({
                type: 'sticky',
                position: { x: 0, y: 0 },
                size: { width: 190, height: 168 },
              })
            }
          >
            Create sticky note
          </button>
          <span>or choose mode + object from left toolbar</span>
        </div>
        {!actions.createObject ? (
          <small>Workspace is read-only until live data connection is ready.</small>
        ) : null}
      </div>
    </div>
  );
}

function StatusNotice({
  data,
  actions,
}: {
  data: CanvasWorkspaceData;
  actions: CanvasWorkspaceActions;
}) {
  if (data.status === 'ready' || data.status === 'loading') return null;
  const isError = data.status === 'error';
  const isConflict = data.status === 'conflict';
  return (
    <div
      className={styles.statusNotice}
      data-state={data.status}
      role={isError || isConflict ? 'alert' : 'status'}
    >
      {data.status === 'offline' ? (
        <CloudOff size={16} />
      ) : data.status === 'reconnecting' ? (
        <RefreshCcw size={16} />
      ) : isConflict ? (
        <Bot size={16} />
      ) : (
        <CloudOff size={16} />
      )}
      <div>
        <strong>{statusLabel(data.status)}</strong>
        <span>
          {isConflict
            ? data.conflictMessage
            : data.errorMessage ||
              (data.status === 'offline'
                ? 'Changes are disabled until connection returns.'
                : 'Trying to restore live updates…')}
        </span>
      </div>
      {actions.retryConnection ? (
        <button type="button" onClick={() => void actions.retryConnection?.()}>
          Retry
        </button>
      ) : null}
    </div>
  );
}

function CollaboratorPresence({
  collaborators,
  objects,
}: {
  collaborators: readonly CanvasCollaborator[];
  objects: readonly CanvasObject[];
}) {
  return (
    <ViewportPortal>
      {collaborators.map((collaborator) => {
        const target = collaborator.targetObjectId
          ? absoluteObjectRectangle(collaborator.targetObjectId, objects)
          : null;
        const position =
          collaborator.position ?? (target ? { x: target.x + 20, y: target.y - 18 } : undefined);
        const selectedIds = new Set(collaborator.selectedObjectIds ?? []);
        if (collaborator.targetObjectId) selectedIds.add(collaborator.targetObjectId);
        return (
          <div key={collaborator.id} aria-hidden="true">
            {[...selectedIds].map((objectId, index) => {
              const rectangle = absoluteObjectRectangle(objectId, objects);
              if (!rectangle) return null;
              return (
                <div
                  className={styles.collaboratorSelection}
                  data-kind={collaborator.kind}
                  data-editing={collaborator.targetObjectId === objectId || undefined}
                  key={objectId}
                  style={{
                    transform: `translate(${rectangle.x}px, ${rectangle.y}px)`,
                    width: rectangle.width,
                    height: rectangle.height,
                    borderColor: collaborator.color,
                    boxShadow: `0 0 0 1px ${collaborator.color}`,
                  }}
                >
                  {index === 0 ? (
                    <span style={{ borderColor: collaborator.color }}>
                      {collaborator.kind === 'worker' && collaborator.engine ? (
                        <AgentEngineIcon engine={collaborator.engine} />
                      ) : null}
                      <span>
                        {collaborator.name}
                        {collaborator.state === 'editing' ? ' · editing' : ''}
                      </span>
                    </span>
                  ) : null}
                </div>
              );
            })}
            {position ? (
              <div
                className={styles.collaboratorCursor}
                data-kind={collaborator.kind}
                style={{
                  transform: `translate(${position.x}px, ${position.y}px)`,
                  color: collaborator.color,
                }}
              >
                <MousePointer2 size={20} fill="currentColor" />
                <span style={{ borderColor: collaborator.color }}>
                  {collaborator.kind === 'worker' && collaborator.engine ? (
                    <AgentEngineIcon engine={collaborator.engine} />
                  ) : null}
                  <span>
                    {collaborator.name}
                    {collaborator.kind === 'worker' && collaborator.engine
                      ? ` · ${collaborator.engine === 'claude' ? 'Claude Sonnet' : 'Codex'}`
                      : ''}
                  </span>
                </span>
              </div>
            ) : null}
          </div>
        );
      })}
    </ViewportPortal>
  );
}

function minimapColor(node: GuildFlowNode) {
  const palette = resolvePaletteId(node.data.object.style, node.data.object.type);
  if (!palette) return NODE_PALETTE.paper.light.fill;
  return NODE_PALETTE[palette].light.fill;
}

function designSetKeyFrom(object: CanvasObject): string | undefined {
  const value = object.semantics.customFields?.designSetKey;
  return typeof value === 'string' ? value : undefined;
}

function screenKeyFrom(object: CanvasObject): string | undefined {
  const value = object.semantics.customFields?.screenKey;
  return typeof value === 'string' ? value : undefined;
}

function CanvasViewport({
  data,
  actions,
  onOpenFocus,
  webMcpState,
}: {
  data: CanvasWorkspaceData;
  actions: CanvasWorkspaceActions;
  onOpenFocus?: (object: CanvasObject) => void;
  webMcpState?: WebMcpRegistrationState;
}) {
  const nodes = useCanvasInteractionStore((state) => state.nodes);
  const edges = useCanvasInteractionStore((state) => state.edges);
  const tool = useCanvasInteractionStore((state) => state.tool);
  const applyNodeChanges = useCanvasInteractionStore((state) => state.applyNodeChanges);
  const applyEdgeChanges = useCanvasInteractionStore((state) => state.applyEdgeChanges);
  const beginInteraction = useCanvasInteractionStore((state) => state.beginInteraction);
  const finishInteraction = useCanvasInteractionStore((state) => state.finishInteraction);
  const selectOnly = useCanvasInteractionStore((state) => state.selectOnly);
  const selectedNodeIds = useCanvasInteractionStore((state) => state.selectedNodeIds);
  const interactingNodeIds = useCanvasInteractionStore((state) => state.interactingNodeIds);
  const connectorRelationship = useCanvasInteractionStore((state) => state.connectorRelationship);
  const { getViewport, setViewport, screenToFlowPosition } = useReactFlow();
  const flowRegionRef = useRef<HTMLElement | null>(null);
  const [panel, setPanel] = useState<CanvasPanel | null>(null);
  const [inspectorEditingObjectId, setInspectorEditingObjectId] = useState<string | null>(null);
  const [expandedObjectId, setExpandedObjectId] = useState<string | null>(null);
  const [annotationDrag, setAnnotationDrag] = useState<{
    start: { x: number; y: number };
    end: { x: number; y: number };
  } | null>(null);
  const expandedObject = data.objects.find((object) => object.id === expandedObjectId) ?? null;
  const setExpandedEditing = useCallback(
    (editing: boolean) => setInspectorEditingObjectId(editing ? expandedObjectId : null),
    [expandedObjectId],
  );
  const openObject = useCallback(
    (object: CanvasObject) => {
      const action = primaryAction(object);
      if (action === 'focus-design' || action === 'focus-evidence') {
        onOpenFocus?.(object);
        return;
      }
      if (object.type === 'icon') return;
      selectOnly(object.id);
      setPanel(null);
      setExpandedObjectId(object.id);
    },
    [onOpenFocus, selectOnly],
  );
  const commentOnObject = useCallback((object: CanvasObject) => {
    useFeedbackStore.getState().openComposer({
      targetObjectId: object.id,
      targetTitle: object.title?.trim() || object.type,
      client: { x: window.innerWidth / 2, y: window.innerHeight / 2 },
    });
  }, []);

  const publishViewport = useCallback((viewport: { x: number; y: number; zoom: number }) => {
    const bounds = flowRegionRef.current?.getBoundingClientRect();
    useCanvasInteractionStore.getState().setPresenceViewport({
      ...viewport,
      width: bounds?.width ?? 0,
      height: bounds?.height ?? 0,
    });
  }, []);

  useEffect(() => {
    const interactingObjectId =
      interactingNodeIds.size === 1 ? ([...interactingNodeIds][0] ?? null) : null;
    const editing =
      interactingObjectId ??
      ((panel === 'inspector' || expandedObjectId === inspectorEditingObjectId) &&
      inspectorEditingObjectId &&
      selectedNodeIds.includes(inspectorEditingObjectId)
        ? inspectorEditingObjectId
        : null);
    useCanvasInteractionStore.getState().setEditingObjectId(editing);
  }, [expandedObjectId, inspectorEditingObjectId, interactingNodeIds, panel, selectedNodeIds]);

  useEffect(() => {
    const region = flowRegionRef.current;
    if (!region) return;
    const observer = new ResizeObserver(() => publishViewport(getViewport()));
    observer.observe(region);
    return () => observer.disconnect();
  }, [getViewport, publishViewport]);

  useEffect(() => {
    const pending = useCanvasInteractionStore.getState().pendingViewport;
    if (!pending) return;
    void setViewport(pending, { duration: 0 });
    useCanvasInteractionStore.getState().setPendingViewport(null);
  }, [setViewport]);

  const connect = useCallback(
    (connection: Connection) => {
      if (!connection.source || !connection.target || connection.source === connection.target)
        return;
      void actions.createConnector?.({
        sourceObjectId: connection.source,
        targetObjectId: connection.target,
        relationship: connectorRelationship,
      });
    },
    [actions, connectorRelationship],
  );

  const dragStop: OnNodeDrag<GuildFlowNode> = useCallback(
    (_event, node) => {
      finishInteraction(node.id);
      void actions.persistMove?.({
        objectId: node.id,
        position: node.position,
        expectedGeometryRevision: node.data.object.revisions.geometry,
      });
    },
    [actions, finishInteraction],
  );

  const beginAnnotation = useCallback(
    (event: ReactMouseEvent) => {
      if (tool !== 'annotate' || event.button !== 0) return;
      event.preventDefault();
      event.stopPropagation();
      setAnnotationDrag({
        start: { x: event.clientX, y: event.clientY },
        end: { x: event.clientX, y: event.clientY },
      });
    },
    [tool],
  );

  useEffect(() => {
    if (!annotationDrag || tool !== 'annotate') return;
    const onMove = (event: MouseEvent) => {
      setAnnotationDrag((current) =>
        current ? { ...current, end: { x: event.clientX, y: event.clientY } } : null,
      );
    };
    const onUp = (event: MouseEvent) => {
      const current = annotationDrag;
      setAnnotationDrag(null);
      const region = flowRegionRef.current;
      if (!region) return;
      const left = Math.min(current.start.x, event.clientX);
      const top = Math.min(current.start.y, event.clientY);
      const right = Math.max(current.start.x, event.clientX);
      const bottom = Math.max(current.start.y, event.clientY);
      const dragged = right - left >= 6 || bottom - top >= 6;
      const elements = [...region.querySelectorAll<HTMLElement>('.react-flow__node[data-id]')];
      const candidates = elements
        .map((element) => {
          const bounds = element.getBoundingClientRect();
          const intersection =
            Math.max(0, Math.min(right, bounds.right) - Math.max(left, bounds.left)) *
            Math.max(0, Math.min(bottom, bounds.bottom) - Math.max(top, bounds.top));
          const containsPoint =
            event.clientX >= bounds.left &&
            event.clientX <= bounds.right &&
            event.clientY >= bounds.top &&
            event.clientY <= bounds.bottom;
          return { element, bounds, score: dragged ? intersection : containsPoint ? 1 : 0 };
        })
        .filter((candidate) => candidate.score > 0)
        .sort((a, b) => {
          if (dragged && b.score !== a.score) return b.score - a.score;
          return a.bounds.width * a.bounds.height - b.bounds.width * b.bounds.height;
        });
      const selected = candidates[0];
      const objectId = selected?.element.dataset.id;
      const object = data.objects.find((candidate) => candidate.id === objectId);
      if (!selected || !objectId || !object) return;
      const bounds = selected.bounds;
      const reference = dragged
        ? {
            surface: 'canvas' as const,
            kind: 'rectangle' as const,
            rectangle: {
              x: clampUnit((left - bounds.left) / bounds.width),
              y: clampUnit((top - bounds.top) / bounds.height),
              width:
                clampUnit((Math.min(right, bounds.right) - bounds.left) / bounds.width) -
                clampUnit((left - bounds.left) / bounds.width),
              height:
                clampUnit((Math.min(bottom, bounds.bottom) - bounds.top) / bounds.height) -
                clampUnit((top - bounds.top) / bounds.height),
            },
          }
        : {
            surface: 'canvas' as const,
            kind: 'point' as const,
            point: {
              x: clampUnit((event.clientX - bounds.left) / bounds.width),
              y: clampUnit((event.clientY - bounds.top) / bounds.height),
            },
          };
      useFeedbackStore.getState().openComposer({
        targetObjectId: objectId,
        targetTitle: object.title?.trim() || object.type,
        reference,
        client: { x: event.clientX, y: event.clientY },
      });
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp, { once: true });
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [annotationDrag, data.objects, tool]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (isEditableTarget(event.target)) return;
      if (event.key === 'v' || event.key === 'V')
        useCanvasInteractionStore.getState().setTool('select');
      if (event.key === 'h' || event.key === 'H')
        useCanvasInteractionStore.getState().setTool('pan');
      if (event.key === 'l' || event.key === 'L')
        useCanvasInteractionStore.getState().setTool('connect');
      if (event.key === 'a' || event.key === 'A')
        useCanvasInteractionStore.getState().setTool('annotate');
      if (event.key === 'c' || event.key === 'C') setPanel('comments');
      if (event.key === 'Escape') {
        if (expandedObjectId) {
          setExpandedObjectId(null);
          return;
        }
        if (panel) {
          setPanel(null);
          return;
        }
        selectOnly(null);
      }
      if ((event.key === 'Backspace' || event.key === 'Delete') && actions.deleteObject) {
        const objectById = new Map(data.objects.map((object) => [object.id, object]));
        for (const id of selectedNodeIds) {
          const object = objectById.get(id);
          if (object && !object.locked) {
            void actions.deleteObject({
              objectId: id,
              expectedHierarchyRevision: object.revisions.hierarchy,
            });
          }
        }
      }
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'z' && !event.shiftKey) {
        event.preventDefault();
        void actions.undo?.();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [actions, data.objects, expandedObjectId, panel, selectOnly, selectedNodeIds]);

  return (
    <div className={styles.workspaceCanvas} data-tool={tool}>
      <TopToolbar data={data} actions={actions} panel={panel} setPanel={setPanel} />
      <main
        ref={flowRegionRef}
        className={styles.flowRegion}
        aria-label={`${data.workspaceTitle} infinite canvas`}
      >
        <ReactFlow<GuildFlowNode, (typeof edges)[number]>
          nodes={nodes}
          edges={edges}
          nodeTypes={canvasNodeTypes}
          edgeTypes={canvasEdgeTypes}
          onNodesChange={applyNodeChanges}
          onEdgesChange={applyEdgeChanges}
          onConnect={connect}
          onNodeDragStart={(_event, node) => beginInteraction(node.id)}
          onNodeDragStop={dragStop}
          onNodeClick={() => undefined}
          onNodeDoubleClick={(_event, node) => {
            if (node.data.object.type === 'text') return;
            openObject(node.data.object);
          }}
          onMouseDown={beginAnnotation}
          onPaneClick={() => {
            if (tool !== 'annotate') selectOnly(null);
          }}
          onPointerMove={(event) => {
            const position = screenToFlowPosition({ x: event.clientX, y: event.clientY });
            useCanvasInteractionStore.getState().setPresenceCursor(position);
          }}
          onPointerLeave={() => useCanvasInteractionStore.getState().setPresenceCursor(null)}
          onInit={(instance) => publishViewport(instance.getViewport())}
          onMove={(_event, viewport) => publishViewport(viewport)}
          nodesDraggable={tool === 'select'}
          nodesConnectable={tool === 'connect'}
          elementsSelectable={tool === 'select' || tool === 'connect'}
          panOnDrag={tool === 'pan' || tool === 'connect' ? [0, 1, 2] : [1, 2]}
          panOnScroll
          selectionOnDrag={tool === 'select'}
          zoomOnPinch
          zoomOnScroll={false}
          deleteKeyCode={null}
          multiSelectionKeyCode={['Meta', 'Control', 'Shift']}
          selectionKeyCode="Shift"
          onlyRenderVisibleElements
          minZoom={0.08}
          maxZoom={2.5}
          fitView
          fitViewOptions={{ padding: 0.18, maxZoom: 1 }}
          colorMode="light"
          proOptions={{ hideAttribution: false }}
        >
          <Background variant={BackgroundVariant.Dots} gap={22} size={1.2} color="#c9c5bb" />
          <CollaboratorPresence collaborators={data.collaborators} objects={data.objects} />
          <Panel position="bottom-left" className={styles.shortcutHint}>
            <span>
              <kbd>V</kbd> select
            </span>
            <span>
              <kbd>H</kbd> pan
            </span>
            <span>
              <kbd>A</kbd> annotate
            </span>
            <span>
              <kbd>C</kbd> comments
            </span>
            <span>
              <kbd>L</kbd> connect
            </span>
            <span>
              <kbd>⌫</kbd> delete
            </span>
          </Panel>
          <MiniMap
            className={styles.minimap}
            nodeColor={minimapColor}
            nodeStrokeWidth={2}
            pannable
            zoomable
            ariaLabel="Workspace minimap"
          />
        </ReactFlow>
        <CanvasCreationToolbar actions={actions} />
        {tool === 'annotate' ? (
          <div className={styles.annotationModeNotice} role="status">
            <MessageSquarePlus size={15} /> Annotation mode · click a component or drag a region
          </div>
        ) : null}
        {annotationDrag ? (
          <div
            className={styles.annotationMarquee}
            style={{
              left: Math.min(annotationDrag.start.x, annotationDrag.end.x),
              top: Math.min(annotationDrag.start.y, annotationDrag.end.y),
              width: Math.abs(annotationDrag.end.x - annotationDrag.start.x),
              height: Math.abs(annotationDrag.end.y - annotationDrag.start.y),
            }}
          />
        ) : null}
        {selectedNodeIds.length === 1
          ? (() => {
              const selected = data.objects.find((object) => object.id === selectedNodeIds[0]);
              return selected ? (
                <SelectionToolbar
                  object={selected}
                  data={data}
                  actions={actions}
                  onOpen={() => openObject(selected)}
                  onComment={() => commentOnObject(selected)}
                  onMore={() => setPanel('inspector')}
                />
              ) : null;
            })()
          : null}
        <AgentDock data={data} actions={actions} />
        <PresentationMode workspaceId={data.workspaceId as never} />
        <CanvasRightPanel
          panel={panel}
          setPanel={setPanel}
          data={data}
          actions={actions}
          onEditingObjectChange={setInspectorEditingObjectId}
        />
        {expandedObject ? (
          <ExpandedObjectDialog
            object={expandedObject}
            bodyStatus={data.selectedObjectBodyStatus}
            updateContent={actions.updateContent}
            onClose={() => setExpandedObjectId(null)}
            onComment={() => {
              setExpandedObjectId(null);
              commentOnObject(expandedObject);
            }}
            onAdvanced={() => {
              setExpandedObjectId(null);
              setPanel('inspector');
            }}
            onEditingChange={setExpandedEditing}
          />
        ) : null}
        <StatusNotice data={data} actions={actions} />
        {data.status === 'loading' ? <LoadingOverlay /> : null}
        {data.status === 'ready' && data.objects.length === 0 ? (
          <EmptyOverlay actions={actions} />
        ) : null}
      </main>
      <div className={styles.connectionStatus} data-state={data.status}>
        {data.status === 'ready' ? <Wifi size={12} /> : <CloudOff size={12} />}
        {statusLabel(data.status)}
      </div>
      {webMcpState ? (
        <div className={styles.webMcpStatus} data-state={webMcpState} role="status">
          WebMCP{' '}
          {webMcpState === 'active'
            ? 'ready'
            : webMcpState === 'unsupported'
              ? 'unavailable in this browser'
              : webMcpState}
        </div>
      ) : null}
    </div>
  );
}

export function WorkspaceCanvas({
  data,
  actions,
  onOpenFocus,
  webMcpState,
}: {
  data: CanvasWorkspaceData;
  actions: CanvasWorkspaceActions;
  onOpenFocus?: (object: CanvasObject) => void;
  webMcpState?: WebMcpRegistrationState;
}) {
  const hydrate = useCanvasInteractionStore((state) => state.hydrate);
  useEffect(() => {
    hydrate(data.workspaceId, data.objects, data.edges, actions);
  }, [actions, data.edges, data.objects, data.workspaceId, hydrate]);

  return (
    <ReactFlowProvider>
      <CanvasViewport
        data={data}
        actions={actions}
        {...(onOpenFocus ? { onOpenFocus } : {})}
        {...(webMcpState ? { webMcpState } : {})}
      />
    </ReactFlowProvider>
  );
}

export { designSetKeyFrom, screenKeyFrom };
