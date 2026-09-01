/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type { AnyComponents, ApiFromModules, FilterApi, FunctionReference } from 'convex/server';
import type * as activity from '../activity.js';
import type * as canvas from '../canvas.js';
import type * as comments from '../comments.js';
import type * as presence from '../presence.js';
import type * as roleProfiles from '../roleProfiles.js';
import type * as runnerTools from '../runnerTools.js';
import type * as runners from '../runners.js';
import type * as runs from '../runs.js';
import type * as tasks from '../tasks.js';
import type * as teams from '../teams.js';
import type * as undo from '../undo.js';
import type * as users from '../users.js';
import type * as workspaces from '../workspaces.js';

declare const fullApi: ApiFromModules<{
  activity: typeof activity;
  canvas: typeof canvas;
  comments: typeof comments;
  presence: typeof presence;
  roleProfiles: typeof roleProfiles;
  runnerTools: typeof runnerTools;
  runners: typeof runners;
  runs: typeof runs;
  tasks: typeof tasks;
  teams: typeof teams;
  undo: typeof undo;
  users: typeof users;
  workspaces: typeof workspaces;
}>;

export declare const api: FilterApi<typeof fullApi, FunctionReference<unknown, 'public'>>;
export declare const internal: FilterApi<typeof fullApi, FunctionReference<unknown, 'internal'>>;
export declare const components: AnyComponents;
