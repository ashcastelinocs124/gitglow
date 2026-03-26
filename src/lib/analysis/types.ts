/**
 * Result shape produced by the AI profile analysis step.
 *
 * This type is defined separately from the analysis module itself so that
 * consumers (store, review page) can import it without depending on the
 * analysis implementation, which may not exist yet.
 */

export interface AnalysisResult {
  headline: string;
  bio: string;
  goals: string;
  archetype: string;
  experienceOutsideGitHub: string | null;
  featuredProjectIds: string[];
  featuredProjectReasons: Record<string, string>;
  visualSuggestions: {
    showTimeline: boolean;
    showLanguageBreakdown: boolean;
    showActivityCard: boolean;
    emphasisThemes: string[];
  };
  voiceNotes: string;
}
