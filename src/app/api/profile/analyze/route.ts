import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { importGitHubProfile } from "@/lib/github/import-profile";
import { analyzeProfile } from "@/lib/analysis/analyze-profile";
import {
  getUserStore,
  setImportData,
  setAnalysisResult,
  setQuestionnaire,
  setFeaturedProjectIds,
} from "@/lib/store";

/**
 * POST /api/profile/analyze
 *
 * Analyzes the authenticated user's GitHub profile using GPT-4o.
 * Falls back to heuristic analysis if the API key is not set or the call fails.
 *
 * Stores the analysis result and derives questionnaire data from it.
 */
export async function POST() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email || !session.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const email = session.user.email;

  try {
    // Get import data from store, or fetch fresh
    let importData = getUserStore(email).importData;

    if (!importData) {
      importData = await importGitHubProfile(session.accessToken);
      setImportData(email, importData);
    }

    // Run the analysis
    const analysis = await analyzeProfile(importData);

    // Store the analysis result
    setAnalysisResult(email, analysis);

    // Derive and store questionnaire data from the analysis
    setQuestionnaire(email, {
      bio: analysis.bio,
      goals: analysis.goals,
      archetype: analysis.archetype,
      experienceOutsideGitHub: analysis.experienceOutsideGitHub ?? undefined,
      voiceNotes: analysis.voiceNotes || undefined,
    });

    // Store featured project IDs from analysis
    setFeaturedProjectIds(email, analysis.featuredProjectIds);

    return NextResponse.json({ success: true, analysis });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Analysis failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
