/**
 * GitHub REST API client wrapper.
 *
 * Wraps fetch-based calls to the GitHub REST API using a user's
 * OAuth access token. Each method returns the raw JSON shape that
 * the GitHub API emits, which is then normalized by import-profile.ts.
 */

const GITHUB_API_BASE = "https://api.github.com";

// ---------- Types for raw GitHub API responses ----------

export interface RawGitHubUser {
  login: string;
  id?: number;
  name?: string | null;
  bio?: string | null;
  avatar_url?: string | null;
  html_url?: string | null;
  followers?: number;
  following?: number;
  public_repos?: number;
}

export interface RawGitHubRepoOwner {
  login: string;
}

export interface RawGitHubRepo {
  id?: number;
  name: string;
  owner?: RawGitHubRepoOwner;
  description?: string | null;
  language?: string | null;
  stargazers_count?: number;
  forks_count?: number;
  pushed_at?: string | null;
}

// ---------- Client class ----------

export class GitHubClient {
  private readonly token: string;

  constructor(accessToken: string) {
    this.token = accessToken;
  }

  /** Fetch the authenticated user's profile. */
  async fetchUser(): Promise<RawGitHubUser> {
    return this.get<RawGitHubUser>("/user");
  }

  /**
   * Fetch repositories for the authenticated user.
   * Returns up to `perPage` repos sorted by most recently pushed.
   */
  async fetchRepos(perPage = 100): Promise<RawGitHubRepo[]> {
    return this.get<RawGitHubRepo[]>(
      `/user/repos?sort=pushed&per_page=${perPage}&type=owner`,
    );
  }

  /**
   * Fetch pinned repository names for a given user login.
   *
   * GitHub does not expose pinned repos via the REST API, so we use the
   * GraphQL API with a minimal query. If the query fails (e.g. token lacks
   * the required scope), we return an empty array rather than throwing.
   */
  async fetchPinnedRepoNames(login: string): Promise<string[]> {
    const query = `
      query($login: String!) {
        user(login: $login) {
          pinnedItems(first: 6, types: REPOSITORY) {
            nodes {
              ... on Repository {
                name
              }
            }
          }
        }
      }
    `;

    try {
      const res = await fetch("https://api.github.com/graphql", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query, variables: { login } }),
      });

      if (!res.ok) return [];

      const json = (await res.json()) as {
        data?: {
          user?: {
            pinnedItems?: {
              nodes?: Array<{ name?: string }>;
            };
          };
        };
      };

      const nodes = json.data?.user?.pinnedItems?.nodes ?? [];
      return nodes
        .map((n) => n.name)
        .filter((name): name is string => typeof name === "string");
    } catch {
      return [];
    }
  }

  // ---------- Internal helpers ----------

  private async get<T>(path: string): Promise<T> {
    const res = await fetch(`${GITHUB_API_BASE}${path}`, {
      headers: {
        Authorization: `Bearer ${this.token}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(
        `GitHub API error ${res.status} on GET ${path}: ${body}`,
      );
    }

    return res.json() as Promise<T>;
  }
}
