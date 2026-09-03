'use client';

import type { FeedbackReference } from '@guild/protocol';
import { create } from 'zustand';

export type FeedbackDraft = {
  id: string;
  body: string;
  targetObjectId: string;
  targetTitle: string;
  reference?: FeedbackReference;
};

type FeedbackComposerTarget = Omit<FeedbackDraft, 'id' | 'body'> & {
  client: { x: number; y: number };
};

type FeedbackStore = {
  workspaceId: string | null;
  drafts: FeedbackDraft[];
  composer: FeedbackComposerTarget | null;
  reviewOpen: boolean;
  setWorkspace: (workspaceId: string) => void;
  openComposer: (target: FeedbackComposerTarget) => void;
  closeComposer: () => void;
  addDraft: (body: string) => void;
  removeDraft: (id: string) => void;
  setReviewOpen: (open: boolean) => void;
  clear: () => void;
};

export const useFeedbackStore = create<FeedbackStore>((set, get) => ({
  workspaceId: null,
  drafts: [],
  composer: null,
  reviewOpen: false,
  setWorkspace: (workspaceId) => {
    if (get().workspaceId === workspaceId) return;
    set({ workspaceId, drafts: [], composer: null, reviewOpen: false });
  },
  openComposer: (composer) => set({ composer }),
  closeComposer: () => set({ composer: null }),
  addDraft: (body) => {
    const composer = get().composer;
    const value = body.trim();
    if (!composer || !value) return;
    const target = {
      targetObjectId: composer.targetObjectId,
      targetTitle: composer.targetTitle,
      ...(composer.reference ? { reference: composer.reference } : {}),
    };
    set({
      drafts: [...get().drafts, { id: crypto.randomUUID(), body: value, ...target }],
      composer: null,
    });
  },
  removeDraft: (id) => set({ drafts: get().drafts.filter((draft) => draft.id !== id) }),
  setReviewOpen: (reviewOpen) => set({ reviewOpen }),
  clear: () => set({ drafts: [], composer: null, reviewOpen: false }),
}));
