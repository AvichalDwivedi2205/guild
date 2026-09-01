import { describe, expect, it } from 'vitest';

import { canConflictAwareRestore } from '@/domain/history';

describe('history restore policy', () => {
  it('offers restore only for applied canvas Change Sets supported by the undo engine', () => {
    expect(canConflictAwareRestore('applied', 'ui', [{ targetKind: 'object' }])).toBe(true);
    expect(canConflictAwareRestore('applied', 'worker', [{ targetKind: 'body' }])).toBe(true);
    expect(canConflictAwareRestore('applied', 'webmcp', [{ targetKind: 'edge' }])).toBe(true);
    expect(canConflictAwareRestore('applied', 'ui', [{ targetKind: 'run' }])).toBe(false);
    expect(canConflictAwareRestore('applied', 'ui', [{ targetKind: 'comment' }])).toBe(false);
    expect(canConflictAwareRestore('undone', 'ui', [{ targetKind: 'object' }])).toBe(false);
    expect(canConflictAwareRestore('applied', 'undo', [{ targetKind: 'object' }])).toBe(false);
    expect(canConflictAwareRestore('applied', 'ui', [])).toBe(false);
  });
});
