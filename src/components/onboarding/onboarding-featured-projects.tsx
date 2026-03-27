"use client";

import { useEffect, useMemo, useState } from "react";
import FeaturedProjectPicker from "@/components/onboarding/featured-project-picker";
import {
  suggestFeaturedProjects,
  type SelectableRepository,
} from "@/lib/profile/featured-projects";

export default function OnboardingFeaturedProjects() {
  const [repos, setRepos] = useState<SelectableRepository[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // No auto-selection — let the user pick freely
  const _suggestFeaturedProjects = suggestFeaturedProjects; // keep import used

  // Fetch real repos from GitHub via our API
  useEffect(() => {
    async function fetchRepos() {
      try {
        const res = await fetch("/api/github/import", { method: "POST" });
        if (!res.ok) {
          const body = await res.json().catch(() => null);
          throw new Error(body?.error ?? `Failed to fetch repos (${res.status})`);
        }
        const json = await res.json();
        const data = json.data;

        if (!data?.repositories) {
          throw new Error("No repository data returned");
        }

        const selectable: SelectableRepository[] = data.repositories.map(
          (r: { githubRepoId: string; name: string; stars: number; description: string | null; primaryLanguage: string | null; isPinned: boolean }) => ({
            id: r.githubRepoId,
            name: r.name,
            stars: r.stars,
            description: r.description,
            primaryLanguage: r.primaryLanguage,
            isPinned: r.isPinned,
          }),
        );

        setRepos(selectable);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load repositories");
      } finally {
        setLoading(false);
      }
    }

    fetchRepos();
  }, []);

  // Save featured selections whenever they change
  useEffect(() => {
    if (selected.length > 0) {
      fetch("/api/profile/featured", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ featuredProjectIds: selected }),
      }).catch(() => {});
    }
  }, [selected]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-600 border-t-emerald-400" />
        <span className="ml-3 text-sm text-slate-400">
          Fetching your GitHub repositories...
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
        {error}
      </div>
    );
  }

  if (repos.length === 0) {
    return (
      <p className="text-sm text-slate-400">No repositories found on your GitHub account.</p>
    );
  }

  return (
    <FeaturedProjectPicker
      repositories={repos}
      selected={selected}
      onChange={setSelected}
    />
  );
}
