import { api } from '../../../../../../convex/_generated/api';
import type { Id } from '../../../../../../convex/_generated/dataModel';
import {
  convexCloudClient,
  pairingExchangeBodySchema,
  parseBody,
  routeError,
} from '@/server/runner-cloud';

export async function POST(request: Request) {
  try {
    const body = await parseBody(request, pairingExchangeBodySchema);
    const result = await convexCloudClient().mutation(api.runners.exchangePairing, {
      pairingId: body.pairingId as Id<'runnerPairings'>,
      deviceCode: body.deviceCode,
    });
    if (!result) return Response.json({ state: 'pending' }, { status: 202 });
    return Response.json(result);
  } catch (error) {
    return routeError(error);
  }
}
