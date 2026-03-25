import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  buildPublishRequest,
  validatePublishRequest,
  executePublish,
} from "@/lib/jobs/publish-readme";
import {
  validateBeforePublish,
  buildSyncFailureMessage,
} from "@/lib/reliability/guards";

/**
 * POST /api/readme/publish
 *
 * Publishes the generated README markdown to the user's GitHub profile
 * README repository (where repo name === GitHub username).
 *
 * Body:
 * - `markdown: string` — The generated README content
 * - `mode: "manual" | "connected"` — How to publish
 * - `hasPreviewConfirmation: boolean` — Whether the user has previewed the README
 *
 * Modes:
 * - "manual": Validates the request and returns the publish request details
 *   so the user can copy/paste or push the file themselves.
 * - "connected": Executes the publish using the user's stored GitHub
 *   access token, committing directly to their profile repo.
 *
 * Returns: `{ success, publishRequest?, committedSha?, error? }`
 */
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Parse and validate the request body
  let body: {
    markdown?: string;
    mode?: string;
    hasPreviewConfirmation?: boolean;
  };
  try {
    body = (await request.json()) as {
      markdown?: string;
      mode?: string;
      hasPreviewConfirmation?: boolean;
    };
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 },
    );
  }

  const { markdown, mode, hasPreviewConfirmation } = body;

  if (!markdown || typeof markdown !== "string") {
    return NextResponse.json(
      { error: "markdown is required and must be a string" },
      { status: 400 },
    );
  }

  if (mode !== "manual" && mode !== "connected") {
    return NextResponse.json(
      { error: 'mode must be "manual" or "connected"' },
      { status: 400 },
    );
  }

  // Pre-publish reliability guard: validate markdown quality and confirmation
  const guard = validateBeforePublish({
    markdown,
    hasPreviewConfirmation: hasPreviewConfirmation ?? false,
  });

  if (!guard.safe) {
    return NextResponse.json(
      { error: guard.reason, warnings: guard.warnings },
      { status: 400 },
    );
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

  if (!githubAccount) {
    return NextResponse.json(
      { error: "No GitHub account linked" },
      { status: 400 },
    );
  }

  const username = githubAccount.login;

  // Build and validate the publish request
  const publishRequest = buildPublishRequest({ username, markdown });
  const validation = validatePublishRequest(publishRequest);

  if (!validation.valid) {
    return NextResponse.json(
      { error: "Validation failed", details: validation.errors },
      { status: 400 },
    );
  }

  // Manual mode: return the request so the user can publish themselves
  if (mode === "manual") {
    return NextResponse.json({
      success: true,
      mode: "manual",
      publishRequest: {
        owner: publishRequest.owner,
        repo: publishRequest.repo,
        branch: publishRequest.branch,
        filePath: publishRequest.filePath,
        commitMessage: publishRequest.commitMessage,
      },
      markdown: publishRequest.markdown,
    });
  }

  // Connected mode: execute the publish via the GitHub API
  if (!githubAccount.accessToken) {
    return NextResponse.json(
      { error: "GitHub access token is missing" },
      { status: 400 },
    );
  }

  const result = await executePublish(
    publishRequest,
    githubAccount.accessToken,
  );

  if (!result.success) {
    // Convert raw error into a user-friendly message
    const userMessage = result.errorMessage
      ? buildSyncFailureMessage(new Error(result.errorMessage))
      : "Publish failed unexpectedly";

    return NextResponse.json(
      {
        success: false,
        error: userMessage,
        warnings: guard.warnings,
      },
      { status: 502 },
    );
  }

  return NextResponse.json({
    success: true,
    mode: "connected",
    committedSha: result.committedSha,
  });
}
