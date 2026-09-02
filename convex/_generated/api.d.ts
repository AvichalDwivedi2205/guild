/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as activity from '../activity.js';
import type * as assets from '../assets.js';
import type * as canvas from '../canvas.js';
import type * as captures from '../captures.js';
import type * as comments from '../comments.js';
import type * as design from '../design.js';
import type * as lib_assetStore from '../lib/assetStore.js';
import type * as lib_auth from '../lib/auth.js';
import type * as lib_commands from '../lib/commands.js';
import type * as lib_content from '../lib/content.js';
import type * as lib_crypto from '../lib/crypto.js';
import type * as lib_geometry from '../lib/geometry.js';
import type * as lib_jobLifecycle from '../lib/jobLifecycle.js';
import type * as lib_policies from '../lib/policies.js';
import type * as lib_projection from '../lib/projection.js';
import type * as lib_recorder from '../lib/recorder.js';
import type * as lib_runLifecycle from '../lib/runLifecycle.js';
import type * as lib_runnerAuth from '../lib/runnerAuth.js';
import type * as migrations from '../migrations.js';
import type * as presence from '../presence.js';
import type * as roleProfiles from '../roleProfiles.js';
import type * as runnerTools from '../runnerTools.js';
import type * as runners from '../runners.js';
import type * as runs from '../runs.js';
import type * as seed from '../seed.js';
import type * as tasks from '../tasks.js';
import type * as teams from '../teams.js';
import type * as undo from '../undo.js';
import type * as users from '../users.js';
import type * as validators from '../validators.js';
import type * as workspaces from '../workspaces.js';
import type * as workstreams from '../workstreams.js';

import type { ApiFromModules, FilterApi, FunctionReference } from 'convex/server';

declare const fullApi: ApiFromModules<{
  activity: typeof activity;
  assets: typeof assets;
  canvas: typeof canvas;
  captures: typeof captures;
  comments: typeof comments;
  design: typeof design;
  'lib/assetStore': typeof lib_assetStore;
  'lib/auth': typeof lib_auth;
  'lib/commands': typeof lib_commands;
  'lib/content': typeof lib_content;
  'lib/crypto': typeof lib_crypto;
  'lib/geometry': typeof lib_geometry;
  'lib/jobLifecycle': typeof lib_jobLifecycle;
  'lib/policies': typeof lib_policies;
  'lib/projection': typeof lib_projection;
  'lib/recorder': typeof lib_recorder;
  'lib/runLifecycle': typeof lib_runLifecycle;
  'lib/runnerAuth': typeof lib_runnerAuth;
  migrations: typeof migrations;
  presence: typeof presence;
  roleProfiles: typeof roleProfiles;
  runnerTools: typeof runnerTools;
  runners: typeof runners;
  runs: typeof runs;
  seed: typeof seed;
  tasks: typeof tasks;
  teams: typeof teams;
  undo: typeof undo;
  users: typeof users;
  validators: typeof validators;
  workspaces: typeof workspaces;
  workstreams: typeof workstreams;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<typeof fullApi, FunctionReference<any, 'public'>>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<typeof fullApi, FunctionReference<any, 'internal'>>;

export declare const components: {};
