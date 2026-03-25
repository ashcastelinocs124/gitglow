/**
 * Refresh job orchestration for profile metrics and visual assets.
 *
 * The key design rule: refresh jobs must NEVER rewrite narrative content
 * unless explicitly requested. Metrics and assets are considered
 * "refresh-safe" and can be updated at any time. Narrative sections
 * (headline, about, goals, archetype, etc.) are user-authored and
 * must only be regenerated with explicit opt-in.
 *
 * This module provides:
 * - `classifyRefreshPlan` — determines what's safe to update based on options
 * - `buildRefreshActions` — converts a plan into an ordered action list
 * - `executeRefreshPlan` — runs the actions and returns results
 * - `describeRefreshForUser` — user-facing messaging via reliability guards
 */

import { describeRefreshType } from "@/lib/reliability/guards";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface RefreshOptions {
  /** Whether to rewrite user narrative sections. Default: false. */
  rewriteNarrative?: boolean;
  /** Whether to regenerate visual asset cards. Default: true. */
  refreshAssets?: boolean;
  /** Whether to re-import and recalculate metrics. Default: true. */
  refreshMetrics?: boolean;
}

export type RefreshAction =
  | { type: "update-metrics"; description: string }
  | { type: "refresh-assets"; description: string }
  | { type: "rewrite-narrative"; description: string };

export interface RefreshPlan {
  safeToUpdateMetrics: boolean;
  safeToRewriteNarrative: boolean;
  safeToRefreshAssets: boolean;
  actions: RefreshAction[];
}

export interface RefreshResult {
  success: boolean;
  actionsCompleted: RefreshAction[];
  errors: string[];
}

/**
 * Context passed to executeRefreshPlan.
 *
 * In a full integration this would carry GitHub data, profile model
 * inputs, and storage adapters. Currently typed as a loose record
 * so the orchestration logic can be tested independently of I/O.
 */
export type RefreshContext = Record<string, unknown>;

// ---------------------------------------------------------------------------
// Classify
// ---------------------------------------------------------------------------

/**
 * Classify a refresh plan based on the given options.
 *
 * Determines what is safe to update:
 * - Metrics are safe to update when `refreshMetrics` is true (default: true)
 * - Assets are safe to refresh when `refreshAssets` is true (default: true)
 * - Narrative is ONLY safe to rewrite when explicitly requested via
 *   `rewriteNarrative: true` (default: false)
 *
 * Returns the plan with a list of actions to execute.
 */
export function classifyRefreshPlan(options: RefreshOptions): RefreshPlan {
  const refreshMetrics = options.refreshMetrics ?? true;
  const refreshAssets = options.refreshAssets ?? true;
  const rewriteNarrative = options.rewriteNarrative ?? false;

  const actions: RefreshAction[] = [];

  if (refreshMetrics) {
    actions.push({
      type: "update-metrics",
      description:
        "Re-import GitHub data and recalculate stars, forks, repos, language breakdown",
    });
  }

  if (refreshAssets) {
    actions.push({
      type: "refresh-assets",
      description:
        "Regenerate visual asset cards (activity, language, journey) with last-good fallback",
    });
  }

  if (rewriteNarrative) {
    actions.push({
      type: "rewrite-narrative",
      description:
        "Regenerate narrative sections (headline, about, goals, archetype)",
    });
  }

  return {
    safeToUpdateMetrics: refreshMetrics,
    safeToRefreshAssets: refreshAssets,
    safeToRewriteNarrative: rewriteNarrative,
    actions,
  };
}

// ---------------------------------------------------------------------------
// Build actions
// ---------------------------------------------------------------------------

/**
 * Extract the ordered action list from a refresh plan.
 *
 * Actions are returned in execution order:
 * 1. update-metrics (data must be fresh before assets use it)
 * 2. refresh-assets (uses the updated metrics)
 * 3. rewrite-narrative (only if explicitly approved)
 *
 * The plan's `actions` array is already in this order from
 * `classifyRefreshPlan`, but this function provides an explicit
 * extraction point for callers that need just the action list.
 */
export function buildRefreshActions(plan: RefreshPlan): RefreshAction[] {
  // Return a copy to prevent mutation of the plan's internal array
  return [...plan.actions];
}

// ---------------------------------------------------------------------------
// Execute
// ---------------------------------------------------------------------------

/**
 * Execute a refresh plan by running each action in order.
 *
 * For each action type:
 * - `update-metrics`: Re-import GitHub data and rebuild the profile model's
 *   metrics section (stars, forks, repos, languages, activity signals).
 * - `refresh-assets`: Regenerate visual cards and save with last-good fallback.
 * - `rewrite-narrative`: Only if explicitly approved, regenerate narrative
 *   sections from questionnaire + GitHub data.
 *
 * Actions that fail are recorded in `errors` but do not prevent subsequent
 * actions from running. The overall `success` flag is true only when all
 * actions complete without errors.
 */
export async function executeRefreshPlan(
  plan: RefreshPlan,
  _context: RefreshContext,
): Promise<RefreshResult> {
  const actionsCompleted: RefreshAction[] = [];
  const errors: string[] = [];
  const actions = buildRefreshActions(plan);

  for (const action of actions) {
    try {
      switch (action.type) {
        case "update-metrics":
          // In a full integration, this would:
          // 1. Re-fetch GitHub profile and repositories via the import layer
          // 2. Rebuild the metrics portion of ProfileModel
          // 3. Persist updated metrics to the database
          actionsCompleted.push(action);
          break;

        case "refresh-assets":
          // In a full integration, this would:
          // 1. Call generateAsset() for each asset kind
          // 2. Call saveAssetLocally() to persist the new SVG
          // 3. Call saveLastGoodAsset() to snapshot the fallback
          actionsCompleted.push(action);
          break;

        case "rewrite-narrative":
          // In a full integration, this would:
          // 1. Combine questionnaire data with fresh GitHub data
          // 2. Regenerate narrative sections (headline, about, goals)
          // 3. Persist updated narrative to the database
          actionsCompleted.push(action);
          break;

        default: {
          // Exhaustive check: if a new action type is added but not handled,
          // TypeScript will catch it at compile time
          const _exhaustive: never = action;
          errors.push(`Unknown action type: ${(_exhaustive as RefreshAction).type}`);
        }
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : `Unknown error during ${action.type}`;
      errors.push(message);
    }
  }

  return {
    success: errors.length === 0,
    actionsCompleted,
    errors,
  };
}

// ---------------------------------------------------------------------------
// User-facing refresh description
// ---------------------------------------------------------------------------

/**
 * Produce a user-facing description of what a refresh will do.
 *
 * Delegates to the reliability guards module to classify the operation
 * as "safe" (metrics/assets only) or "destructive" (narrative rewrite)
 * and generate appropriate messaging.
 */
export function describeRefreshForUser(options: RefreshOptions) {
  return describeRefreshType({
    rewriteNarrative: options.rewriteNarrative ?? false,
  });
}
