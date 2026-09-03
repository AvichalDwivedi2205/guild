import { z } from 'zod';

import { api } from '../../../../../convex/_generated/api';
import type { Id } from '../../../../../convex/_generated/dataModel';
import { bearerToken, convexCloudClient, parseBody, routeError } from '@/server/runner-cloud';

const claimBody = z.object({
  action: z.literal('claim'),
  capacity: z.number().int().min(1).max(4).default(1),
});

const completeBody = z.object({
  action: z.literal('complete'),
  taskId: z.string().min(1).max(200),
  capabilityToken: z.string().min(16).max(4_096),
  attempt: z.number().int().positive(),
  fencingToken: z.number().int().nonnegative(),
  viewportAssetId: z.string().min(1).max(200),
  fullPageAssetId: z.string().min(1).max(200).optional(),
  thumbnailAssetId: z.string().min(1).max(200).optional(),
});

const captureAuthority = {
  taskId: z.string().min(1).max(200),
  capabilityToken: z.string().min(16).max(4_096),
  attempt: z.number().int().positive(),
  fencingToken: z.number().int().nonnegative(),
};

const beginUploadBody = z.object({
  action: z.literal('begin_upload'),
  ...captureAuthority,
  byteSize: z.number().int().min(32).max(5_000_000),
});

const completeUploadBody = z.object({
  action: z.literal('complete_upload'),
  ...captureAuthority,
  intentId: z.string().min(1).max(200),
  storageId: z.string().min(1).max(200),
  checksum: z.string().regex(/^[a-f0-9]{64}$/u),
  byteSize: z.number().int().min(32).max(5_000_000),
  width: z.number().int().positive().max(8_192),
  height: z.number().int().positive().max(8_192),
  mime: z.literal('image/png'),
  altText: z.string().trim().min(1).max(200),
});

const failBody = z.object({
  action: z.literal('fail'),
  taskId: z.string().min(1).max(200),
  capabilityToken: z.string().min(16).max(4_096),
  attempt: z.number().int().positive(),
  fencingToken: z.number().int().nonnegative(),
  error: z.string().min(1).max(500),
});

const bodySchema = z.discriminatedUnion('action', [
  claimBody,
  beginUploadBody,
  completeUploadBody,
  completeBody,
  failBody,
]);

export async function POST(request: Request) {
  try {
    const runnerToken = bearerToken(request);
    const body = await parseBody(request, bodySchema);
    const client = convexCloudClient();
    if (body.action === 'claim') {
      const result = await client.mutation(api.captures.claimPreviewCaptures, {
        runnerToken,
        capacity: body.capacity,
      });
      return Response.json(result);
    }
    if (body.action === 'begin_upload') {
      const result = await client.mutation(api.captures.beginPreviewCaptureUpload, {
        runnerToken,
        taskId: body.taskId as Id<'previewCaptureTasks'>,
        capabilityToken: body.capabilityToken,
        attempt: body.attempt,
        fencingToken: body.fencingToken,
        byteSize: body.byteSize,
      });
      return Response.json(result);
    }
    if (body.action === 'complete_upload') {
      const result = await client.mutation(api.captures.completePreviewCaptureUpload, {
        runnerToken,
        taskId: body.taskId as Id<'previewCaptureTasks'>,
        capabilityToken: body.capabilityToken,
        attempt: body.attempt,
        fencingToken: body.fencingToken,
        intentId: body.intentId as Id<'assetUploadIntents'>,
        storageId: body.storageId as Id<'_storage'>,
        checksum: body.checksum,
        byteSize: body.byteSize,
        width: body.width,
        height: body.height,
        mime: body.mime,
        altText: body.altText,
      });
      return Response.json(result);
    }
    if (body.action === 'complete') {
      const result = await client.mutation(api.captures.completePreviewCapture, {
        runnerToken,
        taskId: body.taskId as Id<'previewCaptureTasks'>,
        capabilityToken: body.capabilityToken,
        attempt: body.attempt,
        fencingToken: body.fencingToken,
        viewportAssetId: body.viewportAssetId as Id<'assets'>,
        ...(body.fullPageAssetId ? { fullPageAssetId: body.fullPageAssetId as Id<'assets'> } : {}),
        ...(body.thumbnailAssetId
          ? { thumbnailAssetId: body.thumbnailAssetId as Id<'assets'> }
          : {}),
      });
      return Response.json(result);
    }
    const result = await client.mutation(api.captures.failPreviewCapture, {
      runnerToken,
      taskId: body.taskId as Id<'previewCaptureTasks'>,
      capabilityToken: body.capabilityToken,
      attempt: body.attempt,
      fencingToken: body.fencingToken,
      error: body.error,
    });
    return Response.json(result);
  } catch (error) {
    return routeError(error);
  }
}
