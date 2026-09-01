import { api } from '../../../../../convex/_generated/api';
import {
  convexCloudClient,
  convexEngineReports,
  iso,
  pairingStartBodySchema,
  parseBody,
  routeError,
} from '@/server/runner-cloud';

export async function POST(request: Request) {
  try {
    const body = await parseBody(request, pairingStartBodySchema);
    const result = await convexCloudClient().mutation(api.runners.beginPairing, {
      runnerName: body.runnerName,
      configuredConcurrency: body.concurrency,
      engines: convexEngineReports(body.engines),
    });
    const verificationUrl = new URL('/runner/pair', request.url);
    verificationUrl.searchParams.set('code', result.userCode);
    return Response.json({
      ...result,
      verificationUrl: verificationUrl.toString(),
      expiresAt: iso(result.expiresAt),
    });
  } catch (error) {
    return routeError(error);
  }
}
