// @vitest-environment edge-runtime

import { convexTest } from 'convex-test';
import { describe, expect, it } from 'vitest';

import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import schema from '../../convex/schema';

const modules = import.meta.glob('../../convex/**/*.*s');

const identity = {
  subject: 'workos_visual_owner',
  issuer: 'https://api.workos.com/user_management/client_test',
  tokenIdentifier: 'https://api.workos.com/user_management/client_test|workos_visual_owner',
  name: 'Visual Owner',
};

describe('Convex visual feedback', () => {
  it('creates an anchor, comment, and exactly one Runner Job for an owned screen', async () => {
    const t = convexTest(schema, modules);
    const asOwner = t.withIdentity(identity);
    const workspaceId = await asOwner.mutation(api.workspaces.create, {
      title: 'Visual feedback workspace',
      boardMode: 'diagram',
    });
    const roleId = await asOwner.mutation(api.roleProfiles.create, {
      workspaceId,
      handle: 'designer',
      name: 'Designer',
      responsibility: 'Own visual design.',
      instructions: 'Respond to visual comments.',
      engine: 'claude',
      capabilities: ['read_workspace', 'write_owned_section', 'comment', 'report_progress'],
      expectedArtifactTypes: ['image', 'wireframeFrame'],
      staticDependencyRoleProfileIds: [],
      color: '#7c3aed',
    });
    const published = await asOwner.mutation(api.design.publishDesignPreview, {
      workspaceId,
      source: 'ui',
      idempotencyKey: 'design:publish:visual:0001',
      designSetKey: 'visual-home',
      title: 'Visual home',
      stage: 'visual',
      deploymentId: 'dep_visual_v1',
      deploymentUrl: 'https://preview.example.com/visual',
      origin: 'https://preview.example.com',
      screens: [
        {
          screenKey: 'landing',
          name: 'Landing',
          route: '/',
          order: 0,
          viewports: ['desktop'],
        },
      ],
    });
    const design = await asOwner.query(api.design.getDesignSet, {
      workspaceId,
      designSetKey: 'visual-home',
    });
    const screen = design?.screens[0];
    const screenRevision = design?.screenRevisions[0];
    expect(screen && screenRevision).toBeTruthy();
    await t.run(async (ctx) => {
      const object = await ctx.db.get(screen!.canvasObjectId);
      if (!object) throw new Error('missing screen object');
      await ctx.db.patch(object._id, {
        semantics: { ...object.semantics, ownerRoleProfileId: roleId },
      });
    });

    const created = await asOwner.mutation(api.visualFeedback.createVisualComment, {
      workspaceId,
      source: 'ui',
      idempotencyKey: 'visual:comment:0001',
      body: 'Raise the sign-in contrast.',
      targetObjectId: screen!.canvasObjectId,
      reference: {
        screenRevisionId: screenRevision!.id,
        screenKey: 'landing',
        route: '/',
        viewportKey: 'desktop',
        viewportWidth: 1440,
        viewportHeight: 900,
        scrollX: 0,
        scrollY: 0,
        kind: 'point',
        point: { x: 0.25, y: 0.4 },
      },
    });
    expect(created.jobId).toBeTruthy();
    expect(created.feedbackId).toBeNull();
    expect(created.anchorId).toBeTruthy();

    const replay = await asOwner.mutation(api.visualFeedback.createVisualComment, {
      workspaceId,
      source: 'ui',
      idempotencyKey: 'visual:comment:0001',
      body: 'Raise the sign-in contrast.',
      targetObjectId: screen!.canvasObjectId,
      reference: {
        screenRevisionId: screenRevision!.id,
        screenKey: 'landing',
        route: '/',
        viewportKey: 'desktop',
        viewportWidth: 1440,
        viewportHeight: 900,
        scrollX: 0,
        scrollY: 0,
        kind: 'point',
        point: { x: 0.25, y: 0.4 },
      },
    });
    expect(replay.idempotentReplay).toBe(true);
    expect(replay.commentId).toBe(created.commentId);
    expect(replay.anchorId).toBe(created.anchorId);
    expect(replay.jobId).toBe(created.jobId);
    expect(replay.feedbackId).toBe(created.feedbackId);

    const runs = await asOwner.query(api.runs.list, { workspaceId, limit: 10 });
    const jobs = runs.flatMap((row) => row.jobs);
    expect(jobs).toHaveLength(1);

    const feedback = await asOwner.query(api.visualFeedback.getAssignmentFeedback, {
      workspaceId,
      jobId: created.jobId as Id<'jobs'>,
    });
    expect(feedback.comment?.body).toContain('contrast');
    void published;
  });

  it('routes hosted-design feedback to Claude when both Claude and Codex are connected', async () => {
    const t = convexTest(schema, modules);
    const asOwner = t.withIdentity(identity);
    const workspaceId = await asOwner.mutation(api.workspaces.create, {
      title: 'External visual workspace',
      boardMode: 'diagram',
    });
    const { designOwnerObjectId, unrelatedObjectId } = await t.run(async (ctx) => {
      const now = Date.now();
      const createObject = (title: string) =>
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
        designOwnerObjectId: await createObject('Claude product design'),
        unrelatedObjectId: await createObject('Architecture'),
      };
    });
    await asOwner.mutation(api.design.publishDesignPreview, {
      workspaceId,
      source: 'ui',
      idempotencyKey: 'design:publish:visual:0002',
      designSetKey: 'external-home',
      title: 'External home',
      stage: 'visual',
      deploymentId: 'dep_external_v1',
      deploymentUrl: 'https://preview.example.com/external',
      origin: 'https://preview.example.com',
      screens: [
        {
          screenKey: 'login',
          name: 'Login',
          route: '/login',
          order: 0,
          viewports: ['desktop'],
          relatedObjectIds: [designOwnerObjectId, unrelatedObjectId],
        },
      ],
    });
    const design = await asOwner.query(api.design.getDesignSet, {
      workspaceId,
      designSetKey: 'external-home',
    });
    let intendedWorkstreamId: Id<'externalWorkstreams'> | undefined;
    await t.run(async (ctx) => {
      const now = Date.now();
      await ctx.db.insert('externalWorkstreams', {
        workspaceId,
        key: 'architecture',
        roleLabel: 'Architecture',
        engineLabel: 'codex',
        objective: 'Own architecture decisions.',
        state: 'reported',
        lastSequence: 0,
        lastEventTime: now,
        lastReceivedAt: now,
        targetObjectId: unrelatedObjectId,
        createdAt: now,
        updatedAt: now,
      });
      intendedWorkstreamId = await ctx.db.insert('externalWorkstreams', {
        workspaceId,
        key: 'cinema-design',
        roleLabel: 'Product design',
        engineLabel: 'claude',
        objective: 'Iterate hosted Cinema screens.',
        state: 'reported',
        lastSequence: 0,
        lastEventTime: now,
        lastReceivedAt: now,
        targetObjectId: designOwnerObjectId,
        createdAt: now,
        updatedAt: now,
      });
    });
    const created = await asOwner.mutation(api.visualFeedback.createVisualComment, {
      workspaceId,
      source: 'ui',
      idempotencyKey: 'visual:comment:0002',
      body: 'Move the primary button.',
      targetObjectId: design!.screens[0]!.canvasObjectId,
      reference: {
        screenRevisionId: design!.screenRevisions[0]!.id,
        screenKey: 'login',
        route: '/login',
        viewportKey: 'desktop',
        viewportWidth: 1440,
        viewportHeight: 900,
        scrollX: 0,
        scrollY: 0,
        kind: 'rectangle',
        rectangle: { x: 0.1, y: 0.2, width: 0.3, height: 0.2 },
      },
    });
    expect(created.jobId).toBeNull();
    expect(created.feedbackId).toBeTruthy();
    const delivered = await t.run(async (ctx) => ctx.db.get(created.feedbackId!));
    expect(delivered?.workstreamId).toBe(intendedWorkstreamId);
    const runs = await asOwner.query(api.runs.list, { workspaceId, limit: 10 });
    expect(runs.flatMap((row) => row.jobs)).toHaveLength(0);
  });

  it('saves an anchored comment when the screen has no delivery target', async () => {
    const t = convexTest(schema, modules);
    const asOwner = t.withIdentity(identity);
    const workspaceId = await asOwner.mutation(api.workspaces.create, {
      title: 'Unrouted visual workspace',
      boardMode: 'diagram',
    });
    await asOwner.mutation(api.design.publishDesignPreview, {
      workspaceId,
      source: 'ui',
      idempotencyKey: 'design:publish:visual:0003',
      designSetKey: 'unrouted-home',
      title: 'Unrouted home',
      stage: 'visual',
      deploymentId: 'dep_unrouted_v1',
      deploymentUrl: 'https://preview.example.com/unrouted',
      origin: 'https://preview.example.com',
      screens: [
        {
          screenKey: 'home',
          name: 'Home',
          route: '/',
          order: 0,
          viewports: ['desktop'],
        },
      ],
    });
    const design = await asOwner.query(api.design.getDesignSet, {
      workspaceId,
      designSetKey: 'unrouted-home',
    });
    const screen = design?.screens[0];
    const screenRevision = design?.screenRevisions[0];
    expect(screen && screenRevision).toBeTruthy();

    const args = {
      workspaceId,
      source: 'ui' as const,
      idempotencyKey: 'visual:comment:0003',
      body: 'Increase spacing above the title.',
      targetObjectId: screen!.canvasObjectId,
      reference: {
        screenRevisionId: screenRevision!.id,
        screenKey: 'home',
        route: '/',
        viewportKey: 'desktop' as const,
        viewportWidth: 1440,
        viewportHeight: 900,
        scrollX: 0,
        scrollY: 0,
        kind: 'point' as const,
        point: { x: 0.4, y: 0.2 },
      },
    };
    const created = await asOwner.mutation(api.visualFeedback.createVisualComment, args);

    expect(created.jobId).toBeNull();
    expect(created.feedbackId).toBeNull();
    const anchors = await asOwner.query(api.visualFeedback.listVisualAnchors, {
      workspaceId,
      designScreenRevisionId: screenRevision!.id,
    });
    expect(anchors).toHaveLength(1);
    expect(anchors[0]?.commentId).toBe(created.commentId);

    const replay = await asOwner.mutation(api.visualFeedback.createVisualComment, args);
    expect(replay.idempotentReplay).toBe(true);
    expect(replay.commentId).toBe(created.commentId);
    expect(replay.anchorId).toBe(created.anchorId);
    expect(replay.jobId).toBeNull();
    expect(replay.feedbackId).toBeNull();
  });
});
