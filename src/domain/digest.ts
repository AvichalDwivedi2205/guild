import type { CanvasObjectType, ProjectArea, ProjectRelationship } from '@/domain/canvas';

type DigestObject = {
  id: string;
  type: CanvasObjectType;
  title: string | null;
  semanticType: string | null;
  projectArea: ProjectArea | null;
  status: string | null;
  priority: string | null;
};

type DigestEdge = {
  sourceObjectId: string;
  targetObjectId: string;
  relationship: ProjectRelationship;
};

function oneLine(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

export function buildWorkspaceDigest(
  input: {
    workspaceId: string;
    title: string;
    objects: readonly DigestObject[];
    edges: readonly DigestEdge[];
    comments: readonly string[];
  },
  options: { maxCharacters: number },
): string {
  if (options.maxCharacters < 64) throw new Error('Workspace digest budget must be at least 64');

  const objectLines = [...input.objects]
    .sort((left, right) => left.id.localeCompare(right.id))
    .map((object) =>
      [
        `- ${object.id} [${object.type}]`,
        object.title ? oneLine(object.title) : '(untitled)',
        object.semanticType ? `semantic=${object.semanticType}` : null,
        object.projectArea ? `area=${object.projectArea}` : null,
        object.status ? `status=${object.status}` : null,
        object.priority ? `priority=${object.priority}` : null,
      ]
        .filter((part): part is string => part !== null)
        .join(' | '),
    );
  const edgeLines = [...input.edges]
    .sort((left, right) =>
      `${left.sourceObjectId}:${left.targetObjectId}:${left.relationship}`.localeCompare(
        `${right.sourceObjectId}:${right.targetObjectId}:${right.relationship}`,
      ),
    )
    .map((edge) => `- ${edge.sourceObjectId} --${edge.relationship}--> ${edge.targetObjectId}`);
  const commentLines = input.comments.map((comment) => `- ${oneLine(comment)}`);
  const digest = [
    `Workspace: ${oneLine(input.title)} (${input.workspaceId})`,
    'Objects:',
    ...(objectLines.length > 0 ? objectLines : ['- none']),
    'Relationships:',
    ...(edgeLines.length > 0 ? edgeLines : ['- none']),
    'Recent human comments:',
    ...(commentLines.length > 0 ? commentLines : ['- none']),
  ].join('\n');

  if (digest.length <= options.maxCharacters) return digest;
  const marker = '\n[truncated]';
  return `${digest.slice(0, options.maxCharacters - marker.length).trimEnd()}${marker}`;
}
