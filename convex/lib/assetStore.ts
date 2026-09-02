import type { Id } from '../_generated/dataModel';
import type { MutationCtx, QueryCtx } from '../_generated/server';

export type AssetStore = {
  generateUploadUrl(): Promise<string>;
  getUrl(storageId: Id<'_storage'>): Promise<string | null>;
};

export function convexAssetStore(
  ctx: Pick<MutationCtx, 'storage'> | Pick<QueryCtx, 'storage'>,
): AssetStore {
  return {
    generateUploadUrl: async () => {
      if (!('generateUploadUrl' in ctx.storage)) throw new Error('asset_store_unavailable');
      return ctx.storage.generateUploadUrl();
    },
    getUrl: async (storageId) => ctx.storage.getUrl(storageId),
  };
}

export function memoryAssetStore(): AssetStore & { put(bytes: Uint8Array): string } {
  const blobs = new Map<string, Uint8Array>();
  return {
    async generateUploadUrl() {
      return `memory://upload/${crypto.randomUUID()}`;
    },
    async getUrl(storageId) {
      return blobs.has(storageId) ? `memory://assets/${storageId}` : null;
    },
    put(bytes) {
      const id = `memory_${blobs.size}` as Id<'_storage'>;
      blobs.set(id, bytes);
      return id;
    },
  };
}
