// @vitest-environment edge-runtime

import { convexTest } from 'convex-test';
import { describe, expect, it } from 'vitest';

import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import schema from '../../convex/schema';

const modules = import.meta.glob('../../convex/**/*.*s');

const identity = {
  subject: 'workos_feedback_owner',
  issuer: 'https://api.workos.com/user_management/client_test',
  tokenIdentifier: 'https://api.workos.com/user_management/client_test|workos_feedback_owner',
  name: 'Feedback Owner',
};

describe('Convex feedback batches', () => {
  it('creates anchored comments but only one revision job per target agent', async () => {
    const t = convexTest(schema, modules);
    const asOwner = t.withIdentity(identity);
    const workspaceId = await asOwner.mutation(api.workspaces.create, {
      title: 'Batch feedback workspace',
      boardMode: 'diagram',
    });
    await asOwner.mutation(api.roleProfiles.create, {
      workspaceId,
      handle: 'architect',
      name: 'System Architect',
      responsibility: 'Own architecture.',
      instructions: 'Revise architecture from anchored feedback.',
      engine: 'codex',
      capabilities: ['read_workspace', 'write_owned_section', 'comment', 'report_progress'],
      expectedArtifactTypes: ['shape', 'text'],
      staticDependencyRoleProfileIds: [],
      color: '#2563eb',
    });
    const roles = await asOwner.query(api.roleProfiles.list, { workspaceId });
    const role = roles[0]!;
    expect(role.ownedSectionId).toBeTruthy();
    const childObjectId = await t.run((ctx) =>
      ctx.db.insert('canvasObjects', {
        workspaceId,
        type: 'shape',
        title: 'Evidence boundary',
        x: 40,
        y: 80,
        width: 220,
        height: 140,
        parentId: role.ownedSectionId!,
        hierarchyPath: [role.ownedSectionId!],
        locked: false,
        style: {},
        semantics: {},
        geometryRevision: 0,
        contentRevision: 0,
        styleRevision: 0,
        semanticsRevision: 0,
        hierarchyRevision: 0,
        isDeleted: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }),
    );

    const result = await asOwner.mutation(api.feedback.dispatchBatch, {
      workspaceId,
      source: 'ui',
      idempotencyKey: 'feedback:batch:0001',
      overallInstruction: 'Keep the architecture legible and implementation-ready.',
      items: [
        {
          body: 'Separate orchestration from search execution.',
          targetObjectId: childObjectId,
          reference: {
            surface: 'canvas',
            kind: 'point',
            point: { x: 0.25, y: 0.3 },
          },
        },
        {
          body: 'Show evidence storage as an explicit boundary.',
          targetObjectId: role.ownedSectionId!,
          reference: {
            surface: 'canvas',
            kind: 'rectangle',
            rectangle: { x: 0.5, y: 0.4, width: 0.25, height: 0.18 },
          },
        },
      ],
    });

    expect(result.jobIds).toHaveLength(1);
    expect(result.commentIds).toHaveLength(2);
    const runs = await asOwner.query(api.runs.list, { workspaceId, limit: 10 });
    expect(runs.flatMap((row) => row.jobs)).toHaveLength(1);

    const feedback = await asOwner.query(api.visualFeedback.getAssignmentFeedback, {
      workspaceId,
      jobId: result.jobIds[0]!,
    });
    expect(feedback.comments).toHaveLength(2);
    expect(feedback.overallInstruction).toContain('implementation-ready');
    expect(feedback.comments[0]?.anchor?.surface).toBe('canvas');

    const replay = await asOwner.mutation(api.feedback.dispatchBatch, {
      workspaceId,
      source: 'ui',
      idempotencyKey: 'feedback:batch:0001',
      overallInstruction: 'Keep the architecture legible and implementation-ready.',
      items: [
        {
          body: 'Separate orchestration from search execution.',
          targetObjectId: childObjectId,
          reference: {
            surface: 'canvas',
            kind: 'point',
            point: { x: 0.25, y: 0.3 },
          },
        },
        {
          body: 'Show evidence storage as an explicit boundary.',
          targetObjectId: role.ownedSectionId!,
          reference: {
            surface: 'canvas',
            kind: 'rectangle',
            rectangle: { x: 0.5, y: 0.4, width: 0.25, height: 0.18 },
          },
        },
      ],
    });
    expect(replay.idempotentReplay).toBe(true);
    const replayRuns = await asOwner.query(api.runs.list, { workspaceId, limit: 10 });
    expect(replayRuns.flatMap((row) => row.jobs)).toHaveLength(1);
  });

  it('delivers many annotations as one external workstream feedback item', async () => {
    const t = convexTest(schema, modules);
    const asOwner = t.withIdentity(identity);
    const workspaceId = await asOwner.mutation(api.workspaces.create, {
      title: 'External batch workspace',
      boardMode: 'diagram',
    });
    const targetObjectId = await t.run(async (ctx) => {
      const now = Date.now();
      const objectId = await ctx.db.insert('canvasObjects', {
        workspaceId,
        type: 'section',
        title: 'Claude product design',
        x: 0,
        y: 0,
        width: 900,
        height: 600,
        hierarchyPath: [],
        locked: false,
        style: {},
        semantics: {},
        geometryRevision: 0,
        contentRevision: 0,
        styleRevision: 0,
        semanticsRevision: 0,
        hierarchyRevision: 0,
        isDeleted: false,
        createdAt: now,
        updatedAt: now,
      });
      await ctx.db.insert('externalWorkstreams', {
        workspaceId,
        key: 'cinema-design',
        roleLabel: 'Product & Visual Designer',
        engineLabel: 'claude',
        objective: 'Revise the hosted Cinema design.',
        state: 'reported',
        lastSequence: 0,
        lastEventTime: now,
        lastReceivedAt: now,
        targetObjectId: objectId,
        createdAt: now,
        updatedAt: now,
      });
      return objectId;
    });

    const result = await asOwner.mutation(api.feedback.dispatchBatch, {
      workspaceId,
      source: 'ui',
      idempotencyKey: 'feedback:batch:external:0001',
      overallInstruction: 'Use restrained liquid glass and reduce gradients.',
      items: [
        {
          body: 'Increase contrast in the scene card.',
          targetObjectId,
          reference: {
            surface: 'canvas',
            kind: 'point',
            point: { x: 0.2, y: 0.2 },
          },
        },
        {
          body: 'Make permit risk visible before location selection.',
          targetObjectId,
          reference: {
            surface: 'canvas',
            kind: 'rectangle',
            rectangle: { x: 0.4, y: 0.3, width: 0.3, height: 0.2 },
          },
        },
      ],
    });

    expect(result.jobIds).toHaveLength(0);
    expect(result.feedbackIds).toHaveLength(1);
    const feedback = await asOwner.query(api.externalWorkstreams.getWorkstreamFeedback, {
      workspaceId,
      workstreamKey: 'cinema-design',
      limit: 20,
    });
    expect(feedback.items).toHaveLength(1);
    expect(feedback.items[0]?.comments).toHaveLength(2);
    expect(feedback.items[0]?.overallInstruction).toContain('liquid glass');
  });

  it('dispatches hosted-design batches to the connected Claude workstream', async () => {
    const t = convexTest(schema, modules);
    const asOwner = t.withIdentity(identity);
    const workspaceId = await asOwner.mutation(api.workspaces.create, {
      title: 'Design routing workspace',
      boardMode: 'wireframe',
    });
    const { claudeTargetId, codexTargetId } = await t.run(async (ctx) => {
      const now = Date.now();
      const insertTarget = (title: string) =>
        ctx.db.insert('canvasObjects', {
          workspaceId,
          type: 'annotation' as const,
          title,
          x: 0,
          y: 0,
          width: 320,
          height: 200,
          hierarchyPath: [],
          locked: false,
          style: {},
          semantics: {},
          geometryRevision: 0,
          contentRevision: 0,
          styleRevision: 0,
          semanticsRevision: 0,
          hierarchyRevision: 0,
          isDeleted: false,
          createdAt: now,
          updatedAt: now,
        });
      return {
        claudeTargetId: await insertTarget('Claude design direction'),
        codexTargetId: await insertTarget('Codex frontend implementation'),
      };
    });
    await asOwner.mutation(api.design.publishDesignPreview, {
      workspaceId,
      source: 'ui',
      idempotencyKey: 'design:routing:v1',
      designSetKey: 'routing-design',
      title: 'Routing design',
      stage: 'visual',
      deploymentId: 'routing-v1',
      deploymentUrl: 'https://preview.example.com',
      origin: 'https://preview.example.com',
      screens: [
        {
          screenKey: 'research',
          name: 'Research',
          route: '/research',
          order: 0,
          viewports: ['desktop'],
          relatedObjectIds: [claudeTargetId, codexTargetId],
        },
      ],
    });
    const design = await asOwner.query(api.design.getDesignSet, {
      workspaceId,
      designSetKey: 'routing-design',
    });
    let claudeWorkstreamId: Id<'externalWorkstreams'> | undefined;
    await t.run(async (ctx) => {
      const now = Date.now();
      claudeWorkstreamId = await ctx.db.insert('externalWorkstreams', {
        workspaceId,
        key: 'routing-claude',
        roleLabel: 'Product & Visual Designer',
        engineLabel: 'claude',
        objective: 'Revise the hosted design.',
        state: 'completed',
        lastSequence: 1,
        lastEventTime: now,
        lastReceivedAt: now,
        targetObjectId: claudeTargetId,
        createdAt: now,
        updatedAt: now,
      });
      await ctx.db.insert('externalWorkstreams', {
        workspaceId,
        key: 'routing-codex',
        roleLabel: 'Canvas & Frontend Engineer',
        engineLabel: 'codex',
        objective: 'Implement the hosted design.',
        state: 'completed',
        lastSequence: 1,
        lastEventTime: now + 1,
        lastReceivedAt: now + 1,
        targetObjectId: codexTargetId,
        createdAt: now,
        updatedAt: now,
      });
    });

    const result = await asOwner.mutation(api.feedback.dispatchBatch, {
      workspaceId,
      source: 'ui',
      idempotencyKey: 'feedback:design-routing:0001',
      items: [
        {
          body: 'Increase contrast on the location card.',
          targetObjectId: design!.screens[0]!.canvasObjectId,
          reference: {
            surface: 'design',
            screenRevisionId: design!.screenRevisions[0]!.id,
            screenKey: 'research',
            route: '/research',
            viewportKey: 'desktop',
            viewportWidth: 1440,
            viewportHeight: 900,
            scrollX: 0,
            scrollY: 0,
            kind: 'point',
            point: { x: 0.5, y: 0.5 },
          },
        },
      ],
    });

    expect(result.feedbackIds).toHaveLength(1);
    const delivered = await t.run(async (ctx) => ctx.db.get(result.feedbackIds[0]!));
    expect(delivered?.workstreamId).toBe(claudeWorkstreamId);
  });
});
