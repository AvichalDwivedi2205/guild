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

  it('routes to exactly one external workstream when no Role Profile owns the screen', async () => {
    const t = convexTest(schema, modules);
    const asOwner = t.withIdentity(identity);
    const workspaceId = await asOwner.mutation(api.workspaces.create, {
      title: 'External visual workspace',
      boardMode: 'diagram',
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
        },
      ],
    });
    const design = await asOwner.query(api.design.getDesignSet, {
      workspaceId,
      designSetKey: 'external-home',
    });
    await t.run(async (ctx) => {
      const now = Date.now();
      await ctx.db.insert('externalWorkstreams', {
        workspaceId,
        key: 'design',
        roleLabel: 'Design',
        engineLabel: 'claude',
        objective: 'Iterate hosted Cinema screens.',
        state: 'reported',
        lastSequence: 0,
        lastEventTime: now,
        lastReceivedAt: now,
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
    const runs = await asOwner.query(api.runs.list, { workspaceId, limit: 10 });
    expect(runs.flatMap((row) => row.jobs)).toHaveLength(0);
  });
});
