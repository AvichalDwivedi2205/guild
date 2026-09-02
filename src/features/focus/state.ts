export type FocusKind = 'none' | 'design' | 'evidence';

export type FocusState =
  | { kind: 'none' }
  | {
      kind: 'design';
      designSetKey: string;
      screenKey?: string;
      version?: number;
    }
  | { kind: 'evidence'; evidenceId?: string; workstreamKey?: string };

const KEY = /^[a-z0-9][a-z0-9._:-]{0,198}$/iu;

function optionalKey(value: string | null): string | undefined {
  if (!value || !KEY.test(value)) return undefined;
  return value;
}

export function parseFocusSearch(search: URLSearchParams): FocusState {
  const kind = search.get('focus');
  if (kind === 'design') {
    const designSetKey = optionalKey(search.get('designSet'));
    if (!designSetKey) return { kind: 'none' };
    const versionValue = search.get('revision');
    const version = versionValue ? Number.parseInt(versionValue, 10) : undefined;
    const screenKey = optionalKey(search.get('screen'));
    return {
      kind: 'design',
      designSetKey,
      ...(screenKey ? { screenKey } : {}),
      ...(version && Number.isInteger(version) && version > 0 ? { version } : {}),
    };
  }
  if (kind === 'evidence') {
    const evidenceId = optionalKey(search.get('evidence'));
    const workstreamKey = optionalKey(search.get('workstream'));
    return {
      kind: 'evidence',
      ...(evidenceId ? { evidenceId } : {}),
      ...(workstreamKey ? { workstreamKey } : {}),
    };
  }
  return { kind: 'none' };
}

export function serializeFocusSearch(state: FocusState): URLSearchParams {
  const search = new URLSearchParams();
  if (state.kind === 'design') {
    search.set('focus', 'design');
    search.set('designSet', state.designSetKey);
    if (state.screenKey) search.set('screen', state.screenKey);
    if (state.version) search.set('revision', String(state.version));
  }
  if (state.kind === 'evidence') {
    search.set('focus', 'evidence');
    if (state.evidenceId) search.set('evidence', state.evidenceId);
    if (state.workstreamKey) search.set('workstream', state.workstreamKey);
  }
  return search;
}

export function focusHref(pathname: string, state: FocusState): string {
  const search = serializeFocusSearch(state);
  const query = search.toString();
  return query ? `${pathname}?${query}` : pathname;
}
