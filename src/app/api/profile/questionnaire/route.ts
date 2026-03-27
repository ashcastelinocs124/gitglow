import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { setQuestionnaire } from "@/lib/store";
import type { QuestionnaireData } from "@/lib/profile/questionnaire";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();

  // Accept any string fields — the data comes from AI analysis or user edits
  const data: QuestionnaireData = {
    bio: typeof body.bio === "string" ? body.bio : "",
    goals: typeof body.goals === "string" ? body.goals : "",
    archetype: typeof body.archetype === "string" ? body.archetype : "",
  };

  if (typeof body.experienceOutsideGitHub === "string") {
    data.experienceOutsideGitHub = body.experienceOutsideGitHub;
  }
  if (typeof body.voiceNotes === "string") {
    data.voiceNotes = body.voiceNotes;
  }

  setQuestionnaire(session.user.email, data);

  return NextResponse.json({ success: true });
}
