import type { Doc } from '../_generated/dataModel';
import type { MutationCtx } from '../_generated/server';

export async function assertCanvasObjectCanBeDeleted(
  ctx: MutationCtx,
  object: Doc<'canvasObjects'>,
): Promise<void> {
  if (object.type !== 'section') return;
  const owner = await ctx.db
    .query('roleProfiles')
    .withIndex('by_ownedSectionId', (index) => index.eq('ownedSectionId', object._id))
    .first();
  if (owner) throw new Error('owned_section_in_use');
}
