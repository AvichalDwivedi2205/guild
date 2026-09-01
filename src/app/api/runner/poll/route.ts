import { api } from '../../../../../convex/_generated/api';
import type { Id } from '../../../../../convex/_generated/dataModel';
import {
  bearerToken,
  convexCloudClient,
  convexEngineReports,
  iso,
  parseBody,
  pollBodySchema,
  routeError,
} from '@/server/runner-cloud';

export async function POST(request: Request) {
  try {
    const runnerToken = bearerToken(request);
    const body = await parseBody(request, pollBodySchema);
    const result = await convexCloudClient().mutation(api.runners.poll, {
      runnerToken,
      configuredConcurrency: body.configuredConcurrency,
      freeCapacity: body.freeCapacity,
      engines: convexEngineReports(body.engines),
      activeAssignments: body.activeAssignments.map((assignment) => ({
        jobId: assignment.jobId as Id<'jobs'>,
        attempt: assignment.attempt,
        fencingToken: assignment.fencingToken,
      })),
      progress: body.progress.map((progress) => ({
        jobId: progress.jobId as Id<'jobs'>,
        attempt: progress.attempt,
        fencingToken: progress.fencingToken,
        sequence: progress.sequence,
        phase: progress.phase,
        message: progress.message,
        ...(progress.targetObjectId
          ? { targetObjectId: progress.targetObjectId as Id<'canvasObjects'> }
          : {}),
      })),
    });
    const origin = new URL(request.url).origin;
    return Response.json({
      ...result,
      serverTime: iso(result.serverTime),
      assignments: result.assignments.map(
        (assignment: {
          jobId: string;
          assignmentExpiresAt: number;
          leaseExpiresAt: number;
          [key: string]: unknown;
        }) => ({
          ...assignment,
          assignmentExpiresAt: iso(assignment.assignmentExpiresAt),
          leaseExpiresAt: iso(assignment.leaseExpiresAt),
          mcpEndpoint: `${origin}/api/runner/jobs/${assignment.jobId}/mcp`,
          completionEndpoint: `${origin}/api/runner/jobs/${assignment.jobId}/completion`,
        }),
      ),
      leaseRenewals: result.leaseRenewals.map(
        (renewal: { leaseExpiresAt: number; [key: string]: unknown }) => ({
          ...renewal,
          leaseExpiresAt: iso(renewal.leaseExpiresAt),
        }),
      ),
    });
  } catch (error) {
    return routeError(error);
  }
}
