// @vitest-environment edge-runtime

import { convexTest } from 'convex-test';
import { describe, expect, it } from 'vitest';

import { api } from '../../convex/_generated/api';
import schema from '../../convex/schema';

const modules = import.meta.glob('../../convex/**/*.*s');

const identity = {
  subject: 'workos_review_owner',
  issuer: 'https://api.workos.com/user_management/client_test',
  tokenIdentifier: 'https://api.workos.com/user_management/client_test|workos_review_owner',
  name: 'Review Owner',
};

describe('Convex design review', () => {
  it('approves an exact revision, rejects a stale base, and restores append-only', async () => {
    const t = convexTest(schema, modules);
    const asOwner = t.withIdentity(identity);
    const workspaceId = await asOwner.mutation(api.workspaces.create, {
      title: 'Review workspace',
      boardMode: 'diagram',
    });
    await asOwner.mutation(api.design.publishDesignPreview, {
      workspaceId,
      source: 'ui',
      idempotencyKey: 'design:publish:review:0001',
      designSetKey: 'review-home',
      title: 'Review home',
      stage: 'visual',
      deploymentId: 'dep_review_v1',
      deploymentUrl: 'https://preview.example.com/review',
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
    const approved = await asOwner.mutation(api.designReview.approveDesignRevision, {
      workspaceId,
      designSetKey: 'review-home',
      version: 1,
      idempotencyKey: 'approve:review-home:v1',
    });
    expect(approved.version).toBe(1);
    const approvalReplay = await asOwner.mutation(api.designReview.approveDesignRevision, {
      workspaceId,
      designSetKey: 'review-home',
      version: 1,
      idempotencyKey: 'approve:review-home:v1',
    });
    expect(approvalReplay.idempotentReplay).toBe(true);
    expect(approvalReplay.decisionId).toBe(approved.decisionId);
    expect(approvalReplay.designRevisionId).toBe(approved.designRevisionId);

    const requested = await asOwner.mutation(api.designReview.requestDesignChanges, {
      workspaceId,
      designSetKey: 'review-home',
      version: 1,
      note: 'Increase contrast.',
      idempotencyKey: 'request:review-home:v1',
    });
    const requestReplay = await asOwner.mutation(api.designReview.requestDesignChanges, {
      workspaceId,
      designSetKey: 'review-home',
      version: 1,
      note: 'Increase contrast.',
      idempotencyKey: 'request:review-home:v1',
    });
    expect(requestReplay.idempotentReplay).toBe(true);
    expect(requestReplay.decisionId).toBe(requested.decisionId);
    expect(requestReplay.designRevisionId).toBe(requested.designRevisionId);

    await expect(
      asOwner.mutation(api.design.publishDesignPreview, {
        workspaceId,
        source: 'ui',
        idempotencyKey: 'design:publish:review:0002',
        designSetKey: 'review-home',
        title: 'Review home',
        stage: 'visual',
        deploymentId: 'dep_review_v2',
        deploymentUrl: 'https://preview.example.com/review-v2',
        origin: 'https://preview.example.com',
        expectedBaseRevision: 0,
        screens: [
          {
            screenKey: 'landing',
            name: 'Landing',
            route: '/home',
            order: 0,
            viewports: ['desktop'],
          },
        ],
      }),
    ).rejects.toThrow();

    const restored = await asOwner.mutation(api.designReview.restoreDesignRevision, {
      workspaceId,
      designSetKey: 'review-home',
      version: 1,
      idempotencyKey: 'restore:review-home:v1',
    });
    expect(restored.version).toBe(2);
    const restoreReplay = await asOwner.mutation(api.designReview.restoreDesignRevision, {
      workspaceId,
      designSetKey: 'review-home',
      version: 1,
      idempotencyKey: 'restore:review-home:v1',
    });
    expect(restoreReplay.idempotentReplay).toBe(true);
    expect(restoreReplay.designRevisionId).toBe(restored.designRevisionId);
    expect(restoreReplay.version).toBe(restored.version);
    const design = await asOwner.query(api.design.getDesignSet, {
      workspaceId,
      designSetKey: 'review-home',
    });
    expect(design?.headRevision?.version).toBe(2);
    expect(design?.designSet.approvedRevisionId).toBe(approved.designRevisionId);
  });
});
