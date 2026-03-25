/**
 * Questionnaire schema and defaults for the onboarding narrative flow.
 *
 * Hand-rolled validation (no zod dependency) that mimics the safeParse API
 * shape so we can swap to zod later without changing call sites.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface QuestionnaireData {
  bio: string;
  goals: string;
  archetype: string;
  experienceOutsideGitHub?: string;
  voiceNotes?: string;
  featuredSkills?: string[];
}

export type SafeParseSuccess = { success: true; data: QuestionnaireData };
export type SafeParseError = { success: false; error: ValidationError[] };
export type SafeParseResult = SafeParseSuccess | SafeParseError;

export interface ValidationError {
  field: string;
  message: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const ARCHETYPE_OPTIONS = [
  "backend",
  "frontend",
  "fullstack",
  "data",
  "devops",
  "mobile",
  "ml",
  "indie",
  "systems",
] as const;

export type Archetype = (typeof ARCHETYPE_OPTIONS)[number];

// ---------------------------------------------------------------------------
// Schema (zod-style safeParse API, hand-rolled)
// ---------------------------------------------------------------------------

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isValidArchetype(value: unknown): value is Archetype {
  return (
    typeof value === "string" &&
    (ARCHETYPE_OPTIONS as readonly string[]).includes(value)
  );
}

export const questionnaireSchema = {
  safeParse(data: unknown): SafeParseResult {
    if (data === null || data === undefined || typeof data !== "object") {
      return {
        success: false,
        error: [{ field: "root", message: "Input must be an object" }],
      };
    }

    const obj = data as Record<string, unknown>;
    const errors: ValidationError[] = [];

    // Required: bio
    if (!isNonEmptyString(obj.bio)) {
      errors.push({ field: "bio", message: "Bio is required" });
    }

    // Required: goals
    if (!isNonEmptyString(obj.goals)) {
      errors.push({ field: "goals", message: "Goals is required" });
    }

    // Required: archetype (must be one of the valid options)
    if (!isValidArchetype(obj.archetype)) {
      errors.push({
        field: "archetype",
        message: `Archetype must be one of: ${ARCHETYPE_OPTIONS.join(", ")}`,
      });
    }

    // Optional: experienceOutsideGitHub (string if provided)
    if (
      obj.experienceOutsideGitHub !== undefined &&
      typeof obj.experienceOutsideGitHub !== "string"
    ) {
      errors.push({
        field: "experienceOutsideGitHub",
        message: "Experience outside GitHub must be a string",
      });
    }

    // Optional: voiceNotes (string if provided)
    if (obj.voiceNotes !== undefined && typeof obj.voiceNotes !== "string") {
      errors.push({
        field: "voiceNotes",
        message: "Voice notes must be a string",
      });
    }

    // Optional: featuredSkills (string array if provided)
    if (obj.featuredSkills !== undefined) {
      if (
        !Array.isArray(obj.featuredSkills) ||
        !obj.featuredSkills.every((s: unknown) => typeof s === "string")
      ) {
        errors.push({
          field: "featuredSkills",
          message: "Featured skills must be an array of strings",
        });
      }
    }

    if (errors.length > 0) {
      return { success: false, error: errors };
    }

    // Build validated data, preserving only known fields
    const validated: QuestionnaireData = {
      bio: obj.bio as string,
      goals: obj.goals as string,
      archetype: obj.archetype as string,
    };

    if (obj.experienceOutsideGitHub !== undefined) {
      validated.experienceOutsideGitHub = obj.experienceOutsideGitHub as string;
    }
    if (obj.voiceNotes !== undefined) {
      validated.voiceNotes = obj.voiceNotes as string;
    }
    if (obj.featuredSkills !== undefined) {
      validated.featuredSkills = obj.featuredSkills as string[];
    }

    return { success: true, data: validated };
  },
};

// ---------------------------------------------------------------------------
// Defaults
// ---------------------------------------------------------------------------

export function defaultQuestionnaire(): {
  bio: string;
  goals: string;
  archetype: string;
  experienceOutsideGitHub: string;
  voiceNotes: string;
  featuredSkills: string[];
} {
  return {
    bio: "",
    goals: "",
    archetype: "",
    experienceOutsideGitHub: "",
    voiceNotes: "",
    featuredSkills: [],
  };
}
