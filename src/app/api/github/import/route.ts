import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { importGitHubProfile } from "@/lib/github/import-profile";

/**
 * POST /api/github/import
 *
 * Triggers a GitHub profile import for the authenticated user.
 * Fetches the user's profile and repositories from GitHub, normalizes the
 * data, and returns it. The caller can then decide what to persist.
 */
export async function POST() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Look up the user and their GitHub account
  const user = await db.user.findUnique({
    where: { email: session.user.email },
    include: { githubAccounts: true },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const githubAccount = user.githubAccounts[0];

  if (!githubAccount?.accessToken) {
    return NextResponse.json(
      { error: "No GitHub account linked or access token missing" },
      { status: 400 },
    );
  }

  try {
    const payload = await importGitHubProfile(githubAccount.accessToken);

    return NextResponse.json({
      success: true,
      data: payload,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Import failed";
    return NextResponse.json(
      { error: message },
      { status: 502 },
    );
  }
}
