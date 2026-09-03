'use client';

import { Play } from 'lucide-react';
import { useState, type FormEvent } from 'react';

import type { CanvasObject } from '@/domain/canvas';
import type { CanvasWorkspaceActions, CanvasWorkspaceData } from '@/features/canvas/types';

import styles from './canvas.module.css';

export function AskAgentComposer({
  object,
  data,
  actions,
  onClose,
}: {
  object: CanvasObject;
  data: CanvasWorkspaceData;
  actions: CanvasWorkspaceActions;
  onClose: () => void;
}) {
  const preferredRoleId = data.roleProfiles.some(
    (role) => role.id === object.semantics.ownerRoleProfileId,
  )
    ? object.semantics.ownerRoleProfileId!
    : (data.roleProfiles[0]?.id ?? '');
  const [roleProfileId, setRoleProfileId] = useState(preferredRoleId);
  const [brief, setBrief] = useState('');
  const [assigning, setAssigning] = useState(false);

  return (
    <form
      className={styles.askAgentComposer}
      onSubmit={(event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!actions.assignJob || !roleProfileId || !brief.trim()) return;
        setAssigning(true);
        void actions
          .assignJob({
            targetObjectId: object.id,
            roleProfileId,
            brief: brief.trim(),
          })
          .then((saved) => {
            if (saved) {
              setBrief('');
              onClose();
            }
          })
          .finally(() => setAssigning(false));
      }}
    >
      <label className={styles.field}>
        <span>Ask agent</span>
        <select value={roleProfileId} onChange={(event) => setRoleProfileId(event.target.value)}>
          {data.roleProfiles.map((role) => (
            <option key={role.id} value={role.id}>
              {role.name}
            </option>
          ))}
        </select>
      </label>
      <textarea
        value={brief}
        rows={3}
        maxLength={10_000}
        placeholder="What should this Worker do?"
        onChange={(event) => setBrief(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            event.currentTarget.form?.requestSubmit();
          }
          if (event.key === 'Escape') onClose();
        }}
      />
      <button
        className={styles.primaryPanelButton}
        type="submit"
        disabled={!actions.assignJob || !roleProfileId || !brief.trim() || assigning}
      >
        <Play size={14} fill="currentColor" /> {assigning ? 'Assigning…' : 'Send'}
      </button>
    </form>
  );
}
