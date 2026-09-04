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
  it('lays six screen previews out as a readable non-overlapping grid', async () => {
    const t = convexTest(schema, modules);
    const asOwner = t.withIdentity(identity);
    const workspaceId = await asOwner.mutation(api.workspaces.create, {
      title: 'Six-screen design workspace',
      boardMode: 'diagram',
    });
    const screens = Array.from({ length: 6 }, (_, index) => ({
      screenKey: `screen-${index + 1}`,
      name: `Screen ${index + 1}`,
      route: `/screen-${index + 1}`,
      order: index,
      viewports: ['desktop' as const],
    }));

    await asOwner.mutation(
      api.design.publishDesignPreview,
      publishArgs(workspaceId, {
        idempotencyKey: 'design:publish:six-screen-grid:0001',
        designSetKey: 'six-screen-grid',
        title: 'Six screen grid',
        screens,
      }),
    );
    const context = await asOwner.query(api.canvas.getWorkspaceContext, {
      workspaceId,
      objectLimit: 50,
    });
    const gallery = context.objects.find(
      (object) => object.logicalKey === 'design:six-screen-grid',
    );
    const previews = context.objects
      .filter((object) => object.parentId === gallery?._id)
      .sort((left, right) => left.y - right.y || left.x - right.x);

    expect(gallery).toMatchObject({ width: 1440, height: 700 });
    expect(previews).toHaveLength(6);
    expect(previews.map(({ x, y, width, height }) => ({ x, y, width, height }))).toEqual([
      { x: 32, y: 64, width: 430, height: 240 },
      { x: 488, y: 64, width: 430, height: 240 },
      { x: 944, y: 64, width: 430, height: 240 },
      { x: 32, y: 336, width: 430, height: 240 },
      { x: 488, y: 336, width: 430, height: 240 },
      { x: 944, y: 336, width: 430, height: 240 },
    ]);
  });

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

    await expect(
      asOwner.mutation(
        api.design.publishDesignPreview,
        publishArgs(workspaceId, {
          idempotencyKey: 'design:publish:cinema-home:network-path',
          designSetKey: 'cinema-network-path',
          screens: [
            {
              screenKey: 'landing',
              name: 'Landing',
              route: '//evil.example/landing',
              order: 0,
              viewports: ['desktop'],
            },
          ],
        }),
      ),
    ).rejects.toThrow();

    await expect(
      asOwner.mutation(
        api.design.publishDesignPreview,
        publishArgs(workspaceId, {
          idempotencyKey: 'design:publish:cinema-home:origin-mismatch',
          designSetKey: 'cinema-origin-mismatch',
          deploymentUrl: 'https://evil.example/cinema',
        }),
      ),
    ).rejects.toThrow('origin_mismatch');

    const set = await asOwner.query(api.design.getDesignSet, {
      workspaceId,
      designSetKey: 'cinema-home',
    });
    expect(set?.headRevision?.version).toBe(1);
    expect(set?.screens[0]?.key).toBe('landing');

    await t.run(async (ctx) => {
      const storageId = await ctx.storage.store(
        new Blob([new Uint8Array([137, 80, 78, 71])], { type: 'image/png' }),
      );
      const assetId = await ctx.db.insert('assets', {
        workspaceId,
        storageId,
        kind: 'viewport',
        mime: 'image/png',
        byteSize: 4,
        width: 1440,
        height: 900,
        checksum: 'a'.repeat(64),
        altText: 'Cinema landing desktop',
        provenance: 'runner_capture',
        designRevisionId: first.designRevisionId,
        status: 'ready',
        createdAt: Date.now(),
      });
      const task = await ctx.db.get(first.captureTaskIds[0]!);
      if (!task) throw new Error('capture task missing');
      await ctx.db.patch(task._id, {
        state: 'completed',
        viewportAssetId: assetId,
        updatedAt: Date.now(),
      });
      await ctx.db.patch(task.designScreenRevisionId, { captureReady: true });
    });
    const capturedSet = await asOwner.query(api.design.getDesignSet, {
      workspaceId,
      designSetKey: 'cinema-home',
    });
    expect(capturedSet?.screenRevisions[0]?.captures[0]?.viewportUrl).toMatch(/^https?:\/\//u);

    const status = await asOwner.query(api.design.getDesignRevisionStatus, {
      workspaceId,
      designSetKey: 'cinema-home',
    });
    expect(status?.version).toBe(1);
    expect(status?.captureReady).toBe(true);
    expect(status?.captures[0]?.state).toBe('completed');

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
    const firstRevision = await asOwner.query(api.design.getDesignSet, {
      workspaceId,
      designSetKey: 'cinema-home',
      version: 1,
    });
    expect(firstRevision?.headRevision?.version).toBe(2);
    expect(firstRevision?.selectedRevision?.version).toBe(1);
    expect(firstRevision?.screenRevisions[0]?.route).toBe('/');
    expect(firstRevision?.revisionHistory.map((revision) => revision.version)).toEqual([2, 1]);
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
