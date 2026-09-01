import { api } from '../../../../../../../convex/_generated/api';
import {
  assignmentAuthorization,
  assignmentCompletionBodySchema,
  convexCloudClient,
  parseBody,
  routeError,
} from '@/server/runner-cloud';

export async function POST(request: Request, { params }: { params: Promise<{ jobId: string }> }) {
  try {
    const { jobId } = await params;
    const workerAuthorization = assignmentAuthorization(request);
    if (workerAuthorization.jobId !== jobId) throw new Error('invalid_job_capability');
    const body = await parseBody(request, assignmentCompletionBodySchema);
    await convexCloudClient().mutation(api.runners.complete, {
      workerAuthorization,
      state: body.state,
      ...(body.finalMessage ? { finalMessage: body.finalMessage } : {}),
      ...(body.state === 'failed' && body.reason ? { errorMessage: body.reason } : {}),
    });
    return new Response(null, { status: 204 });
  } catch (error) {
    return routeError(error);
  }
}
