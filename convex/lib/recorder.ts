import { canonicalRequestHash } from '../../packages/guild-protocol/src/index';

import type { Id } from '../_generated/dataModel';
import type { MutationCtx } from '../_generated/server';
import { beginChangeSet, type ChangedRevision, type CommandPrincipal } from './commands';

export async function hashWorkspaceRequest(value: unknown): Promise<string> {
  return canonicalRequestHash(value);
}

export async function recordWorkspaceMutation<T>(
  ctx: MutationCtx,
  input: {
    principal: CommandPrincipal;
    workspaceId: Id<'workspaces'>;
    commandName: string;
    idempotencyKey: string;
    requestHash: string;
    summary: string;
    apply: (args: { changeSetId: Id<'changeSets'> }) => Promise<T>;
  },
): Promise<
  | { replay: true; changeSetId: Id<'changeSets'>; changed: ChangedRevision[] }
  | { replay: false; result: T }
> {
  const started = await beginChangeSet(ctx, {
    workspaceId: input.workspaceId,
    principal: input.principal,
    idempotencyKey: input.idempotencyKey,
    summary: input.summary,
    commandName: input.commandName,
    requestHash: input.requestHash,
  });
  if (started.replay) {
    return { replay: true, changeSetId: started.changeSetId, changed: started.changed };
  }
  return {
    replay: false,
    result: await input.apply({ changeSetId: started.changeSetId }),
  };
}
