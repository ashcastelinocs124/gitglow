import { describe, expect, it } from "vitest";

describe("GitHub import", () => {
  it("normalizes profile and repository data", async () => {
    const { normalizeImportPayload } = await import(
      "@/lib/github/import-profile"
    );
    const normalized = normalizeImportPayload({
      login: "octocat",
      repos: [{ name: "hello-world", stargazers_count: 10 }],
    });

    expect(normalized.profile.login).toBe("octocat");
    expect(normalized.repositories).toHaveLength(1);
  });

  it("handles missing optional profile fields gracefully", async () => {
    const { normalizeImportPayload } = await import(
      "@/lib/github/import-profile"
    );
    const normalized = normalizeImportPayload({
      login: "minimal-user",
      repos: [],
    });

    expect(normalized.profile.login).toBe("minimal-user");
    expect(normalized.profile.name).toBeNull();
    expect(normalized.profile.bio).toBeNull();
    expect(normalized.profile.avatarUrl).toBeNull();
    expect(normalized.profile.followers).toBe(0);
    expect(normalized.profile.following).toBe(0);
    expect(normalized.profile.publicRepos).toBe(0);
    expect(normalized.repositories).toHaveLength(0);
  });

  it("handles null descriptions and missing languages in repos", async () => {
    const { normalizeImportPayload } = await import(
      "@/lib/github/import-profile"
    );
    const normalized = normalizeImportPayload({
      login: "octocat",
      name: "The Octocat",
      bio: "GitHub mascot",
      avatar_url: "https://avatars.githubusercontent.com/u/583231",
      html_url: "https://github.com/octocat",
      followers: 100,
      following: 5,
      public_repos: 2,
      repos: [
        {
          id: 1296269,
          name: "hello-world",
          owner: { login: "octocat" },
          description: null,
          language: null,
          stargazers_count: 10,
          forks_count: 3,
          pushed_at: "2024-01-15T00:00:00Z",
        },
        {
          id: 1296270,
          name: "second-repo",
          owner: { login: "octocat" },
          description: "A second repository",
          language: "TypeScript",
          stargazers_count: 42,
          forks_count: 7,
          pushed_at: null,
        },
      ],
      pinned_repos: ["hello-world"],
    });

    expect(normalized.profile.name).toBe("The Octocat");
    expect(normalized.profile.bio).toBe("GitHub mascot");
    expect(normalized.profile.avatarUrl).toBe(
      "https://avatars.githubusercontent.com/u/583231",
    );
    expect(normalized.profile.profileUrl).toBe("https://github.com/octocat");
    expect(normalized.profile.followers).toBe(100);
    expect(normalized.profile.following).toBe(5);
    expect(normalized.profile.publicRepos).toBe(2);

    expect(normalized.repositories).toHaveLength(2);

    const [first, second] = normalized.repositories;
    expect(first.githubRepoId).toBe("1296269");
    expect(first.name).toBe("hello-world");
    expect(first.ownerLogin).toBe("octocat");
    expect(first.description).toBeNull();
    expect(first.primaryLanguage).toBeNull();
    expect(first.stars).toBe(10);
    expect(first.forks).toBe(3);
    expect(first.isPinned).toBe(true);
    expect(first.pushedAt).toEqual(new Date("2024-01-15T00:00:00Z"));

    expect(second.githubRepoId).toBe("1296270");
    expect(second.description).toBe("A second repository");
    expect(second.primaryLanguage).toBe("TypeScript");
    expect(second.stars).toBe(42);
    expect(second.forks).toBe(7);
    expect(second.isPinned).toBe(false);
    expect(second.pushedAt).toBeNull();
  });

  it("defaults repo fields when data is sparse", async () => {
    const { normalizeImportPayload } = await import(
      "@/lib/github/import-profile"
    );
    const normalized = normalizeImportPayload({
      login: "sparse-user",
      repos: [{ name: "bare-repo" }],
    });

    const repo = normalized.repositories[0];
    expect(repo.name).toBe("bare-repo");
    expect(repo.githubRepoId).toBe("0");
    expect(repo.ownerLogin).toBe("sparse-user");
    expect(repo.description).toBeNull();
    expect(repo.primaryLanguage).toBeNull();
    expect(repo.stars).toBe(0);
    expect(repo.forks).toBe(0);
    expect(repo.isPinned).toBe(false);
    expect(repo.pushedAt).toBeNull();
  });
});
