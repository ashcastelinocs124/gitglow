import { describe, expect, it } from "vitest";

describe("refresh profile job", () => {
  // --- classifyRefreshPlan ---

  it("updates refresh-safe content without rewriting the user narrative", async () => {
    const { classifyRefreshPlan } = await import("@/lib/jobs/refresh-profile");
    const plan = classifyRefreshPlan({ rewriteNarrative: false });
    expect(plan.safeToUpdateMetrics).toBe(true);
    expect(plan.safeToRewriteNarrative).toBe(false);
  });

  it("enables narrative rewrite when explicitly requested", async () => {
    const { classifyRefreshPlan } = await import("@/lib/jobs/refresh-profile");
    const plan = classifyRefreshPlan({ rewriteNarrative: true });
    expect(plan.safeToUpdateMetrics).toBe(true);
    expect(plan.safeToRewriteNarrative).toBe(true);
  });

  it("defaults to metrics + assets enabled, narrative disabled", async () => {
    const { classifyRefreshPlan } = await import("@/lib/jobs/refresh-profile");
    const plan = classifyRefreshPlan({});
    expect(plan.safeToUpdateMetrics).toBe(true);
    expect(plan.safeToRefreshAssets).toBe(true);
    expect(plan.safeToRewriteNarrative).toBe(false);
  });

  // --- action list generation ---

  it("generates correct actions for default options", async () => {
    const { classifyRefreshPlan } = await import("@/lib/jobs/refresh-profile");
    const plan = classifyRefreshPlan({});
    expect(plan.actions).toHaveLength(2);
    expect(plan.actions.map((a) => a.type)).toContain("update-metrics");
    expect(plan.actions.map((a) => a.type)).toContain("refresh-assets");
    expect(plan.actions.map((a) => a.type)).not.toContain("rewrite-narrative");
  });

  it("includes narrative action when rewriteNarrative is true", async () => {
    const { classifyRefreshPlan } = await import("@/lib/jobs/refresh-profile");
    const plan = classifyRefreshPlan({ rewriteNarrative: true });
    expect(plan.actions).toHaveLength(3);
    expect(plan.actions.map((a) => a.type)).toContain("rewrite-narrative");
  });

  it("narrative is protected by default even when all other options are true", async () => {
    const { classifyRefreshPlan } = await import("@/lib/jobs/refresh-profile");
    const plan = classifyRefreshPlan({
      refreshAssets: true,
      refreshMetrics: true,
    });
    expect(plan.safeToRewriteNarrative).toBe(false);
    expect(plan.actions.map((a) => a.type)).not.toContain("rewrite-narrative");
  });

  // --- refresh plan with all options disabled ---

  it("produces an empty action list when all options are disabled", async () => {
    const { classifyRefreshPlan } = await import("@/lib/jobs/refresh-profile");
    const plan = classifyRefreshPlan({
      rewriteNarrative: false,
      refreshAssets: false,
      refreshMetrics: false,
    });
    expect(plan.safeToUpdateMetrics).toBe(false);
    expect(plan.safeToRefreshAssets).toBe(false);
    expect(plan.safeToRewriteNarrative).toBe(false);
    expect(plan.actions).toHaveLength(0);
  });

  // --- refresh plan with custom combination ---

  it("allows metrics-only refresh without assets", async () => {
    const { classifyRefreshPlan } = await import("@/lib/jobs/refresh-profile");
    const plan = classifyRefreshPlan({
      refreshMetrics: true,
      refreshAssets: false,
    });
    expect(plan.safeToUpdateMetrics).toBe(true);
    expect(plan.safeToRefreshAssets).toBe(false);
    expect(plan.safeToRewriteNarrative).toBe(false);
    expect(plan.actions).toHaveLength(1);
    expect(plan.actions[0].type).toBe("update-metrics");
  });

  it("allows assets-only refresh without metrics", async () => {
    const { classifyRefreshPlan } = await import("@/lib/jobs/refresh-profile");
    const plan = classifyRefreshPlan({
      refreshMetrics: false,
      refreshAssets: true,
    });
    expect(plan.safeToUpdateMetrics).toBe(false);
    expect(plan.safeToRefreshAssets).toBe(true);
    expect(plan.safeToRewriteNarrative).toBe(false);
    expect(plan.actions).toHaveLength(1);
    expect(plan.actions[0].type).toBe("refresh-assets");
  });

  // --- buildRefreshActions ---

  it("buildRefreshActions returns actions in correct order", async () => {
    const { classifyRefreshPlan, buildRefreshActions } = await import(
      "@/lib/jobs/refresh-profile"
    );
    const plan = classifyRefreshPlan({ rewriteNarrative: true });
    const actions = buildRefreshActions(plan);

    // Order should be: metrics first, then assets, then narrative
    expect(actions[0].type).toBe("update-metrics");
    expect(actions[1].type).toBe("refresh-assets");
    expect(actions[2].type).toBe("rewrite-narrative");
  });

  it("buildRefreshActions preserves descriptions from plan", async () => {
    const { classifyRefreshPlan, buildRefreshActions } = await import(
      "@/lib/jobs/refresh-profile"
    );
    const plan = classifyRefreshPlan({});
    const actions = buildRefreshActions(plan);

    for (const action of actions) {
      expect(typeof action.description).toBe("string");
      expect(action.description.length).toBeGreaterThan(0);
    }
  });

  // --- executeRefreshPlan ---

  it("executeRefreshPlan returns success for an empty plan", async () => {
    const { classifyRefreshPlan, executeRefreshPlan } = await import(
      "@/lib/jobs/refresh-profile"
    );
    const plan = classifyRefreshPlan({
      refreshMetrics: false,
      refreshAssets: false,
      rewriteNarrative: false,
    });
    const result = await executeRefreshPlan(plan, {});

    expect(result.success).toBe(true);
    expect(result.actionsCompleted).toHaveLength(0);
    expect(result.errors).toHaveLength(0);
  });

  it("executeRefreshPlan reports actions completed on success", async () => {
    const { classifyRefreshPlan, executeRefreshPlan } = await import(
      "@/lib/jobs/refresh-profile"
    );
    const plan = classifyRefreshPlan({
      refreshMetrics: true,
      refreshAssets: false,
      rewriteNarrative: false,
    });
    const result = await executeRefreshPlan(plan, {});

    // Without real GitHub data, the metrics action should still be attempted
    // and reported in actionsCompleted or errors
    expect(result).toHaveProperty("success");
    expect(result).toHaveProperty("actionsCompleted");
    expect(result).toHaveProperty("errors");
    expect(Array.isArray(result.actionsCompleted)).toBe(true);
    expect(Array.isArray(result.errors)).toBe(true);
  });
});
