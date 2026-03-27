import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { importGitHubProfile } from "@/lib/github/import-profile";
import { setImportData } from "@/lib/store";

/**
 * POST /api/github/import
 *
 * Fetches the authenticated user's GitHub profile and repositories,
 * normalizes the data, stores it in memory, and returns it.
 */
export async function POST() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email || !session.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const payload = await importGitHubProfile(session.accessToken);
    setImportData(session.user.email, payload);

    return NextResponse.json({ success: true, data: payload });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Import failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

/**
 * GET /api/github/import
 *
 * Returns cached import data if available, otherwise triggers a fresh import.
 */
export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email || !session.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const payload = await importGitHubProfile(session.accessToken);
    setImportData(session.user.email, payload);

    return NextResponse.json({ success: true, data: payload });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Import failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
