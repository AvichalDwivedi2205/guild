import { assertPublicHttpUrl, implementationEvidenceSchemas } from '@guild/protocol';
import { v } from 'convex/values';

import { action, internalMutation, internalQuery, mutation, query } from './_generated/server';
import { internal } from './_generated/api';
import { requireWorkspaceMember } from './lib/auth';
import { appendChange, resolveCommandPrincipal } from './lib/commands';
import { hashWorkspaceRequest, recordWorkspaceMutation } from './lib/recorder';

export const reportImplementationEvidence = mutation({
  args: {
    workspaceId: v.id('workspaces'),
    idempotencyKey: v.string(),
    workstreamKey: v.string(),
    kind: v.union(
      v.literal('changed_files'),
      v.literal('check'),
      v.literal('commit'),
      v.literal('pull_request'),
      v.literal('hosted_preview'),
    ),
    projectLabel: v.string(),
    branch: v.optional(v.string()),
    commit: v.optional(v.string()),
    changedFiles: v.optional(v.array(v.string())),
    diffSummary: v.optional(v.string()),
    checks: v.optional(
      v.array(
        v.object({
          name: v.string(),
          outcome: v.union(v.literal('passed'), v.literal('failed'), v.literal('skipped')),
          durationMs: v.optional(v.number()),
          summary: v.optional(v.string()),
        }),
      ),
    ),
    url: v.optional(v.string()),
    relatedObjectIds: v.optional(v.array(v.string())),
    eventTime: v.number(),
  },
  handler: async (ctx, args) => {
    const request = implementationEvidenceSchemas.report.parse(args);
    if (request.url) assertPublicHttpUrl(request.url);
    if (request.projectLabel.includes('/') && request.projectLabel.startsWith('/')) {
      throw new Error('absolute_path_rejected');
    }
    const principal = await resolveCommandPrincipal(ctx, args.workspaceId, 'webmcp');
    const requestHash = await hashWorkspaceRequest({
      commandName: 'evidence.report',
      ...request,
    });
    const recorded = await recordWorkspaceMutation(ctx, {
      principal,
      workspaceId: args.workspaceId,
      commandName: 'evidence.report',
      idempotencyKey: request.idempotencyKey,
      requestHash,
      summary: `Reported ${request.kind} evidence`,
      apply: async ({ changeSetId }) => {
        const evidenceId = await ctx.db.insert('implementationEvidence', {
          workspaceId: args.workspaceId,
          workstreamKey: request.workstreamKey,
          kind: request.kind,
          projectLabel: request.projectLabel,
          ...(request.branch ? { branch: request.branch } : {}),
          ...(request.commit ? { commit: request.commit } : {}),
          ...(request.changedFiles ? { changedFiles: request.changedFiles } : {}),
          ...(request.diffSummary ? { diffSummary: request.diffSummary } : {}),
          ...(request.checks
            ? {
                checks: request.checks.map((check) => ({
                  name: check.name,
                  outcome: check.outcome,
                  ...(check.durationMs !== undefined ? { durationMs: check.durationMs } : {}),
                  ...(check.summary ? { summary: check.summary } : {}),
                })),
              }
            : {}),
          ...(request.url ? { url: request.url } : {}),
          relatedObjectIds: request.relatedObjectIds ?? [],
          verificationState: 'reported',
          reporterUserId: principal.userId,
          eventTime: request.eventTime,
          createdAt: Date.now(),
        });
        await appendChange(ctx, {
          workspaceId: args.workspaceId,
          changeSetId,
          targetKind: 'reportedEvidence',
          targetId: evidenceId,
          segment: 'lifecycle',
          beforeValue: null,
          afterValue: { kind: request.kind, projectLabel: request.projectLabel },
          postRevision: 0,
          sequence: 0,
        });
        return { evidenceId, verificationState: 'reported' as const };
      },
    });
    if (recorded.replay) {
      return { evidenceId: recorded.changed[0]?.targetId, verificationState: 'reported' as const };
    }
    return recorded.result;
  },
});

export const listImplementationEvidence = query({
  args: {
    workspaceId: v.id('workspaces'),
    evidenceId: v.optional(v.id('implementationEvidence')),
    workstreamKey: v.optional(v.string()),
    subjectObjectId: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    implementationEvidenceSchemas.list.parse({
      workspaceId: args.workspaceId,
      ...(args.evidenceId ? { evidenceId: args.evidenceId } : {}),
      ...(args.workstreamKey ? { workstreamKey: args.workstreamKey } : {}),
      ...(args.subjectObjectId ? { subjectObjectId: args.subjectObjectId } : {}),
      limit: args.limit ?? 25,
    });
    await requireWorkspaceMember(ctx, args.workspaceId, 'viewer');
    const rows = args.evidenceId
      ? [await ctx.db.get(args.evidenceId)].filter(
          (row): row is NonNullable<typeof row> =>
            row !== null && row.workspaceId === args.workspaceId,
        )
      : args.workstreamKey
        ? await ctx.db
            .query('implementationEvidence')
            .withIndex('by_workspaceId_and_workstreamKey', (query) =>
              query.eq('workspaceId', args.workspaceId).eq('workstreamKey', args.workstreamKey!),
            )
            .take(args.limit ?? 25)
        : await ctx.db
            .query('implementationEvidence')
            .withIndex('by_workspaceId', (query) => query.eq('workspaceId', args.workspaceId))
            .take(args.limit ?? 25);
    const workstreamFiltered =
      args.evidenceId && args.workstreamKey
        ? rows.filter((row) => row.workstreamKey === args.workstreamKey)
        : rows;
    const filtered = args.subjectObjectId
      ? workstreamFiltered.filter((row) => row.relatedObjectIds.includes(args.subjectObjectId!))
      : workstreamFiltered;
    return {
      items: filtered.map((item) => ({
        id: item._id,
        kind: item.kind,
        projectLabel: item.projectLabel,
        branch: item.branch ?? null,
        commit: item.commit ?? null,
        changedFiles: item.changedFiles ?? [],
        summary: item.diffSummary ?? null,
        checks: (item.checks ?? []).map((check) => ({
          ...check,
          provenance: 'reported' as const,
        })),
        url: item.url ?? null,
        verificationState: item.verificationState,
        workstreamKey: item.workstreamKey,
      })),
    };
  },
});

export const recordLinkCheck = internalMutation({
  args: {
    workspaceId: v.id('workspaces'),
    evidenceId: v.id('implementationEvidence'),
    requestedUrl: v.string(),
    resolvedUrl: v.optional(v.string()),
    httpStatus: v.optional(v.number()),
    state: v.union(v.literal('link_verified'), v.literal('unavailable')),
    failure: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireWorkspaceMember(ctx, args.workspaceId, 'viewer');
    const evidence = await ctx.db.get(args.evidenceId);
    if (!evidence || evidence.workspaceId !== args.workspaceId)
      throw new Error('evidence_not_found');
    await ctx.db.insert('evidenceLinkChecks', {
      workspaceId: args.workspaceId,
      evidenceId: args.evidenceId,
      requestedUrl: args.requestedUrl,
      ...(args.resolvedUrl ? { resolvedUrl: args.resolvedUrl } : {}),
      ...(args.httpStatus !== undefined ? { httpStatus: args.httpStatus } : {}),
      state: args.state,
      ...(args.failure ? { failure: args.failure } : {}),
      createdAt: Date.now(),
    });
    if (args.state === 'link_verified' && evidence.verificationState === 'reported') {
      await ctx.db.patch(evidence._id, { verificationState: 'link_verified' });
    }
    if (args.state === 'unavailable' && evidence.verificationState === 'reported') {
      await ctx.db.patch(evidence._id, { verificationState: 'unavailable' });
    }
    return { ok: true };
  },
});

export const verifyEvidenceLink = action({
  args: {
    workspaceId: v.id('workspaces'),
    evidenceId: v.id('implementationEvidence'),
  },
  handler: async (ctx, args) => {
    const evidence = await ctx.runQuery(internal.evidence.getEvidenceInternal, args);
    if (!evidence?.url) return { state: 'unavailable' as const, failure: 'missing_url' };
    try {
      const requested = assertPublicHttpUrl(evidence.url);
      const response = await fetch(requested.toString(), {
        method: 'HEAD',
        redirect: 'manual',
        signal: AbortSignal.timeout(5_000),
      });
      const location = response.headers.get('location');
      if (location) {
        assertPublicHttpUrl(new URL(location, requested).toString());
      }
      const resolved = location ? new URL(location, requested).toString() : requested.toString();
      const ok = response.status >= 200 && response.status < 400;
      await ctx.runMutation(internal.evidence.recordLinkCheck, {
        workspaceId: args.workspaceId,
        evidenceId: args.evidenceId,
        requestedUrl: requested.toString(),
        resolvedUrl: resolved,
        httpStatus: response.status,
        state: ok ? 'link_verified' : 'unavailable',
        ...(ok ? {} : { failure: `http_${response.status}` }),
      });
      return { state: ok ? ('link_verified' as const) : ('unavailable' as const) };
    } catch (error) {
      await ctx.runMutation(internal.evidence.recordLinkCheck, {
        workspaceId: args.workspaceId,
        evidenceId: args.evidenceId,
        requestedUrl: evidence.url,
        state: 'unavailable',
        failure: error instanceof Error ? error.message.slice(0, 200) : 'unsafe_url',
      });
      return { state: 'unavailable' as const };
    }
  },
});

export const getEvidenceInternal = internalQuery({
  args: {
    workspaceId: v.id('workspaces'),
    evidenceId: v.id('implementationEvidence'),
  },
  handler: async (ctx, args) => {
    await requireWorkspaceMember(ctx, args.workspaceId, 'viewer');
    const evidence = await ctx.db.get(args.evidenceId);
    if (!evidence || evidence.workspaceId !== args.workspaceId) return null;
    return evidence;
  },
});
