/**
 * Publish job orchestration for GitHub profile README.
 *
 * The GitHub profile README convention is that a repository whose name
 * matches the user's GitHub username (e.g. `octocat/octocat`) will
 * have its README.md rendered on the user's profile page.
 *
 * This module provides:
 * - `buildPublishRequest` — creates a well-formed publish request
 * - `validatePublishRequest` — validates a publish request before execution
 * - `executePublish` — pushes the README to GitHub via the Contents API
 * - `createProfileRepo` — creates the profile README repo if it doesn't exist
 */

const GITHUB_API_BASE = "https://api.github.com";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PublishRequest {
  owner: string; // GitHub username
  repo: string; // Same as username (profile README repo convention)
  branch: string; // Default: "main"
  filePath: string; // "README.md"
  markdown: string; // The generated content
  commitMessage: string; // "Update profile README via Gitglow"
}

export interface PublishResult {
  success: boolean;
  committedSha: string | null;
  errorMessage: string | null;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

interface BuildPublishOptions {
  username: string;
  markdown: string;
  branch?: string;
}

// ---------------------------------------------------------------------------
// Build
// ---------------------------------------------------------------------------

/**
 * Create a PublishRequest from minimal inputs.
 *
 * The profile README convention dictates that both `owner` and `repo`
 * are set to the GitHub username. Defaults: branch = "main",
 * filePath = "README.md".
 */
export function buildPublishRequest(
  options: BuildPublishOptions,
): PublishRequest {
  return {
    owner: options.username,
    repo: options.username,
    branch: options.branch ?? "main",
    filePath: "README.md",
    markdown: options.markdown,
    commitMessage: "Update profile README via Gitglow",
  };
}

// ---------------------------------------------------------------------------
// Validate
// ---------------------------------------------------------------------------

/**
 * Validate a publish request before execution.
 *
 * Checks:
 * - `owner` is not empty
 * - `markdown` is not empty (trimmed)
 * - `repo` matches `owner` (profile README convention)
 */
export function validatePublishRequest(
  request: PublishRequest,
): ValidationResult {
  const errors: string[] = [];

  if (!request.owner || request.owner.trim().length === 0) {
    errors.push("owner must not be empty");
  }

  if (!request.markdown || request.markdown.trim().length === 0) {
    errors.push("markdown must not be empty");
  }

  if (
    request.owner &&
    request.owner.trim().length > 0 &&
    request.repo !== request.owner
  ) {
    errors.push("repo must match owner for profile README");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// ---------------------------------------------------------------------------
// Execute
// ---------------------------------------------------------------------------

/**
 * Execute the publish flow: check repo, check existing file, create/update.
 *
 * Steps:
 * 1. Check if the profile repo exists (GET /repos/{owner}/{repo})
 * 2. If it does not exist, create it via `createProfileRepo`
 * 3. Check if README.md exists to get the current file SHA
 * 4. Create or update README.md (PUT /repos/{owner}/{repo}/contents/README.md)
 * 5. Return PublishResult with committed SHA or error
 *
 * This function never throws — it always returns a PublishResult.
 */
export async function executePublish(
  request: PublishRequest,
  accessToken: string,
): Promise<PublishResult> {
  const headers = {
    Authorization: `Bearer ${accessToken}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "Content-Type": "application/json",
  };

  try {
    // Step 1: Check if the profile repo exists
    const repoRes = await fetch(
      `${GITHUB_API_BASE}/repos/${request.owner}/${request.repo}`,
      { headers },
    );

    if (repoRes.status === 404) {
      // Step 2: Create the profile repo
      const createResult = await createProfileRepo(
        request.owner,
        accessToken,
      );
      if (!createResult.success) {
        return {
          success: false,
          committedSha: null,
          errorMessage:
            createResult.errorMessage ??
            "Failed to create profile repository",
        };
      }
    } else if (!repoRes.ok) {
      const body = await repoRes.text().catch(() => "");
      return {
        success: false,
        committedSha: null,
        errorMessage: `Failed to check repository: ${repoRes.status} ${body}`,
      };
    }

    // Step 3: Check if README.md already exists (to get the SHA for updates)
    let existingSha: string | undefined;

    const fileRes = await fetch(
      `${GITHUB_API_BASE}/repos/${request.owner}/${request.repo}/contents/${request.filePath}?ref=${request.branch}`,
      { headers },
    );

    if (fileRes.ok) {
      const fileData = (await fileRes.json()) as { sha?: string };
      existingSha = fileData.sha;
    }
    // 404 is fine — means the file doesn't exist yet

    // Step 4: Create or update the file
    const content = Buffer.from(request.markdown).toString("base64");

    const putBody: Record<string, string> = {
      message: request.commitMessage,
      content,
      branch: request.branch,
    };

    if (existingSha) {
      putBody.sha = existingSha;
    }

    const putRes = await fetch(
      `${GITHUB_API_BASE}/repos/${request.owner}/${request.repo}/contents/${request.filePath}`,
      {
        method: "PUT",
        headers,
        body: JSON.stringify(putBody),
      },
    );

    if (!putRes.ok) {
      const body = await putRes.text().catch(() => "");
      return {
        success: false,
        committedSha: null,
        errorMessage: `Failed to update README: ${putRes.status} ${body}`,
      };
    }

    const putData = (await putRes.json()) as {
      commit?: { sha?: string };
    };

    return {
      success: true,
      committedSha: putData.commit?.sha ?? null,
      errorMessage: null,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown publish error";
    return {
      success: false,
      committedSha: null,
      errorMessage: message,
    };
  }
}

// ---------------------------------------------------------------------------
// Create Profile Repo
// ---------------------------------------------------------------------------

/**
 * Create the profile README repository if it doesn't exist.
 *
 * GitHub renders README.md from a repo named after the user as the
 * user's profile README. This helper creates that repo with a
 * description indicating its purpose.
 */
export async function createProfileRepo(
  username: string,
  accessToken: string,
): Promise<PublishResult> {
  const headers = {
    Authorization: `Bearer ${accessToken}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "Content-Type": "application/json",
  };

  try {
    const res = await fetch(`${GITHUB_API_BASE}/user/repos`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        name: username,
        description: `${username}'s GitHub profile README`,
        private: false,
        auto_init: true, // Creates an initial commit with a default README
      }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      return {
        success: false,
        committedSha: null,
        errorMessage: `Failed to create profile repo: ${res.status} ${body}`,
      };
    }

    return {
      success: true,
      committedSha: null,
      errorMessage: null,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error creating repo";
    return {
      success: false,
      committedSha: null,
      errorMessage: message,
    };
  }
}
