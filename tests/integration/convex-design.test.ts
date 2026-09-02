// @vitest-environment edge-runtime

import { convexTest } from 'convex-test';
import { describe, expect, it } from 'vitest';

import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import schema from '../../convex/schema';

const modules = import.meta.glob('../../convex/**/*.*s');

const identity = {
  subject: 'workos_design_owner',
  issuer: 'https://api.workos.com/user_management/client_test',
  tokenIdentifier: 'https://api.workos.com/user_management/client_test|workos_design_owner',
  name: 'Design Owner',
};

function publishArgs(workspaceId: Id<'workspaces'>, overrides: Record<string, unknown> = {}) {
  return {
    workspaceId,
    source: 'ui' as const,
    idempotencyKey: 'design:publish:cinema-home:0001',
    designSetKey: 'cinema-home',
    title: 'Cinema home',
    stage: 'visual' as const,
    deploymentId: 'dep_cinema_home_v1',
    deploymentUrl: 'https://preview.example.com/cinema',
    origin: 'https://preview.example.com',
    screens: [
      {
        screenKey: 'landing',
        name: 'Landing',
        route: '/',
        order: 0,
        viewports: ['desktop' as const],
      },
    ],
    ...overrides,
  };
}

describe('Convex design publication', () => {
  it('publishes a gallery card, replays identically, and rejects stale or marked-up payloads', async () => {
    const t = convexTest(schema, modules);
    const asOwner = t.withIdentity(identity);
    const workspaceId = await asOwner.mutation(api.workspaces.create, {
      title: 'Design publication workspace',
      boardMode: 'diagram',
    });

    const first = await asOwner.mutation(api.design.publishDesignPreview, publishArgs(workspaceId));
    expect(first.version).toBe(1);
    expect(first.idempotentReplay).toBe(false);
    expect(first.screenObjectIds).toHaveLength(1);
    expect(first.captureTaskIds).toHaveLength(1);

    const context = await asOwner.query(api.canvas.getWorkspaceContext, {
      workspaceId,
      objectLimit: 50,
    });
    const gallery = context.objects.find((object) => object.logicalKey === 'design:cinema-home');
    const screen = context.objects.find(
      (object) => object.logicalKey === 'design:cinema-home:screen:landing',
    );
    expect(gallery).toEqual(
      expect.objectContaining({
        type: 'section',
        title: 'Cinema home',
        semantics: expect.objectContaining({ semanticType: 'designSet' }),
      }),
    );
    expect(screen).toEqual(
      expect.objectContaining({
        type: 'image',
        title: 'Landing',
        parentId: gallery?._id,
        semantics: expect.objectContaining({ semanticType: 'designScreen' }),
      }),
    );
    expect(JSON.stringify(context.objects)).not.toMatch(/<html|<script/iu);

    const replay = await asOwner.mutation(
      api.design.publishDesignPreview,
      publishArgs(workspaceId),
    );
    expect(replay.idempotentReplay).toBe(true);
    expect(replay.designRevisionId).toBe(first.designRevisionId);
    expect(replay.version).toBe(1);

    await expect(
      asOwner.mutation(
        api.design.publishDesignPreview,
        publishArgs(workspaceId, {
          title: 'Cinema home revised',
        }),
      ),
    ).rejects.toThrow('idempotency_payload_mismatch');

    await expect(
      asOwner.mutation(
        api.design.publishDesignPreview,
        publishArgs(workspaceId, {
          idempotencyKey: 'design:publish:cinema-home:0002',
          expectedBaseRevision: 99,
          deploymentId: 'dep_cinema_home_v2',
        }),
      ),
    ).rejects.toThrow('stale_base_revision');

    await expect(
      asOwner.mutation(
        api.design.publishDesignPreview,
        publishArgs(workspaceId, {
          idempotencyKey: 'design:publish:cinema-home:html',
          designSetKey: 'cinema-html',
          title: '<script>alert(1)</script>',
        }),
      ),
    ).rejects.toThrow('raw_markup_rejected');

    const set = await asOwner.query(api.design.getDesignSet, {
      workspaceId,
      designSetKey: 'cinema-home',
    });
    expect(set?.headRevision?.version).toBe(1);
    expect(set?.screens[0]?.key).toBe('landing');

    const status = await asOwner.query(api.design.getDesignRevisionStatus, {
      workspaceId,
      designSetKey: 'cinema-home',
    });
    expect(status?.version).toBe(1);
    expect(status?.captureReady).toBe(false);
    expect(status?.captures[0]?.state).toBe('queued');

    const second = await asOwner.mutation(
      api.design.publishDesignPreview,
      publishArgs(workspaceId, {
        idempotencyKey: 'design:publish:cinema-home:0002',
        expectedBaseRevision: 1,
        deploymentId: 'dep_cinema_home_v2',
        title: 'Cinema home v2',
      }),
    );
    expect(second.version).toBe(2);
    expect(second.designSetId).toBe(first.designSetId);
    expect(second.galleryObjectId).toBe(first.galleryObjectId);
  });

  it('rejects unauthenticated publication and cross-workspace related objects', async () => {
    const t = convexTest(schema, modules);
    const asOwner = t.withIdentity(identity);
    const workspaceId = await asOwner.mutation(api.workspaces.create, {
      title: 'Owner workspace',
    });
    const otherWorkspaceId = await asOwner.mutation(api.workspaces.create, {
      title: 'Other workspace',
    });
    const otherObject = await asOwner.mutation(api.canvas.executeCommands, {
      workspaceId: otherWorkspaceId,
      source: 'ui',
      idempotencyKey: 'other-object-0001',
      summary: 'Create foreign requirement',
      commands: [
        {
          type: 'create_object',
          objectType: 'sticky',
          title: 'Foreign requirement',
          position: { x: 40, y: 40 },
          size: { width: 200, height: 120 },
        },
      ],
    });

    await expect(
      t.mutation(api.design.publishDesignPreview, publishArgs(workspaceId)),
    ).rejects.toThrow('unauthenticated');
    await expect(
      asOwner.mutation(
        api.design.publishDesignPreview,
        publishArgs(workspaceId, {
          screens: [
            {
              screenKey: 'landing',
              name: 'Landing',
              route: '/',
              order: 0,
              viewports: ['desktop'],
              relatedObjectIds: [otherObject.changed[0]!.targetId],
            },
          ],
        }),
      ),
    ).rejects.toThrow('workspace_mismatch');
  });
});
