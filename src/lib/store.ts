/**
 * Simple in-memory store for dev use (no database required).
 * Keyed by user email. Will be replaced by Prisma queries once a DB is running.
 */

import type { NormalizedImportPayload } from "@/lib/github/import-profile";
import type { QuestionnaireData } from "@/lib/profile/questionnaire";
import type { AnalysisResult } from "@/lib/analysis/types";

interface UserStore {
  importData?: NormalizedImportPayload;
  questionnaire?: QuestionnaireData;
  featuredProjectIds?: string[];
  analysisResult?: AnalysisResult;
}

const store = new Map<string, UserStore>();

export function getUserStore(email: string): UserStore {
  if (!store.has(email)) {
    store.set(email, {});
  }
  return store.get(email)!;
}

export function setImportData(email: string, data: NormalizedImportPayload) {
  const s = getUserStore(email);
  s.importData = data;
}

export function setQuestionnaire(email: string, data: QuestionnaireData) {
  const s = getUserStore(email);
  s.questionnaire = data;
}

export function setFeaturedProjectIds(email: string, ids: string[]) {
  const s = getUserStore(email);
  s.featuredProjectIds = ids;
}

export function setAnalysisResult(email: string, data: AnalysisResult) {
  const s = getUserStore(email);
  s.analysisResult = data;
}
