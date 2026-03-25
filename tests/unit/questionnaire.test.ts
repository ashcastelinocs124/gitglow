import { describe, expect, it } from "vitest";

describe("questionnaire schema", () => {
  it("requires narrative framing fields", async () => {
    const { questionnaireSchema } = await import("@/lib/profile/questionnaire");
    const parsed = questionnaireSchema.safeParse({
      bio: "Backend engineer",
      goals: "Show platform work",
      archetype: "backend",
    });

    expect(parsed.success).toBe(true);
  });

  it("rejects empty bio", async () => {
    const { questionnaireSchema } = await import("@/lib/profile/questionnaire");
    const parsed = questionnaireSchema.safeParse({
      bio: "",
      goals: "Show platform work",
      archetype: "backend",
    });

    expect(parsed.success).toBe(false);
  });

  it("rejects empty goals", async () => {
    const { questionnaireSchema } = await import("@/lib/profile/questionnaire");
    const parsed = questionnaireSchema.safeParse({
      bio: "Backend engineer",
      goals: "",
      archetype: "backend",
    });

    expect(parsed.success).toBe(false);
  });

  it("rejects invalid archetype", async () => {
    const { questionnaireSchema } = await import("@/lib/profile/questionnaire");
    const parsed = questionnaireSchema.safeParse({
      bio: "Backend engineer",
      goals: "Show platform work",
      archetype: "astronaut",
    });

    expect(parsed.success).toBe(false);
  });

  it("accepts optional fields when provided", async () => {
    const { questionnaireSchema } = await import("@/lib/profile/questionnaire");
    const parsed = questionnaireSchema.safeParse({
      bio: "Backend engineer",
      goals: "Show platform work",
      archetype: "fullstack",
      experienceOutsideGitHub: "10 years in fintech",
      voiceNotes: "Keep it professional",
      featuredSkills: ["TypeScript", "Go"],
    });

    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.experienceOutsideGitHub).toBe("10 years in fintech");
      expect(parsed.data.voiceNotes).toBe("Keep it professional");
      expect(parsed.data.featuredSkills).toEqual(["TypeScript", "Go"]);
    }
  });

  it("accepts when optional fields are omitted", async () => {
    const { questionnaireSchema } = await import("@/lib/profile/questionnaire");
    const parsed = questionnaireSchema.safeParse({
      bio: "Backend engineer",
      goals: "Show platform work",
      archetype: "data",
    });

    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.experienceOutsideGitHub).toBeUndefined();
      expect(parsed.data.voiceNotes).toBeUndefined();
      expect(parsed.data.featuredSkills).toBeUndefined();
    }
  });

  it("exports ARCHETYPE_OPTIONS with all valid values", async () => {
    const { ARCHETYPE_OPTIONS } = await import("@/lib/profile/questionnaire");
    expect(ARCHETYPE_OPTIONS).toEqual([
      "backend",
      "frontend",
      "fullstack",
      "data",
      "devops",
      "mobile",
      "ml",
      "indie",
      "systems",
    ]);
  });

  it("exports defaultQuestionnaire with empty defaults", async () => {
    const { defaultQuestionnaire } = await import("@/lib/profile/questionnaire");
    const defaults = defaultQuestionnaire();
    expect(defaults.bio).toBe("");
    expect(defaults.goals).toBe("");
    expect(defaults.archetype).toBe("");
    expect(defaults.experienceOutsideGitHub).toBe("");
    expect(defaults.voiceNotes).toBe("");
    expect(defaults.featuredSkills).toEqual([]);
  });

  it("rejects non-object input", async () => {
    const { questionnaireSchema } = await import("@/lib/profile/questionnaire");
    const parsed = questionnaireSchema.safeParse(null);
    expect(parsed.success).toBe(false);

    const parsed2 = questionnaireSchema.safeParse("string");
    expect(parsed2.success).toBe(false);
  });

  it("validates all archetype options individually", async () => {
    const { questionnaireSchema, ARCHETYPE_OPTIONS } = await import(
      "@/lib/profile/questionnaire"
    );
    for (const archetype of ARCHETYPE_OPTIONS) {
      const parsed = questionnaireSchema.safeParse({
        bio: "Engineer",
        goals: "Build things",
        archetype,
      });
      expect(parsed.success).toBe(true);
    }
  });
});
