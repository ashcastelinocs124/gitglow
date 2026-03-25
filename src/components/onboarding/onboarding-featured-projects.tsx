"use client";

import { useEffect, useMemo, useState } from "react";
import FeaturedProjectPicker from "@/components/onboarding/featured-project-picker";
import {
  suggestFeaturedProjects,
  type SelectableRepository,
} from "@/lib/profile/featured-projects";

/**
 * Stateful wrapper that loads the user's imported repositories from the API
 * and manages the selected-featured-projects state during onboarding.
 *
 * Until the API endpoint exists (Task 7+), this component renders placeholder
 * demo data so the UI can be exercised visually.
 */

// ---------------------------------------------------------------------------
// Placeholder data — will be replaced with a real fetch once the API exists
// ---------------------------------------------------------------------------

const PLACEHOLDER_REPOS: SelectableRepository[] = [
  {
    id: "demo-1",
    name: "gitglow",
    stars: 128,
    description: "Generate stunning GitHub profile READMEs from your activity.",
    primaryLanguage: "TypeScript",
    isPinned: true,
  },
  {
    id: "demo-2",
    name: "react-data-grid",
    stars: 342,
    description: "A lightweight, fast data-grid component for React.",
    primaryLanguage: "TypeScript",
    isPinned: false,
  },
  {
    id: "demo-3",
    name: "go-cache",
    stars: 89,
    description: "An in-memory key-value store with TTL eviction.",
    primaryLanguage: "Go",
    isPinned: true,
  },
  {
    id: "demo-4",
    name: "ml-pipeline",
    stars: 56,
    description: "End-to-end ML pipeline for tabular data.",
    primaryLanguage: "Python",
    isPinned: false,
  },
  {
    id: "demo-5",
    name: "dotfiles",
    stars: 12,
    description: null,
    primaryLanguage: "Shell",
    isPinned: false,
  },
  {
    id: "demo-6",
    name: "blog",
    stars: 5,
    description: "Personal blog built with Astro.",
    primaryLanguage: "JavaScript",
    isPinned: false,
  },
  {
    id: "demo-7",
    name: "rustlings-solutions",
    stars: 3,
    description: "My solutions to the Rustlings exercises.",
    primaryLanguage: "Rust",
    isPinned: false,
  },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function OnboardingFeaturedProjects() {
  const [repos, setRepos] = useState<SelectableRepository[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Auto-suggest initial selection
  const initialSuggestions = useMemo(() => {
    if (repos.length === 0) return [];
    return suggestFeaturedProjects(repos).map((r) => r.id);
  }, [repos]);

  // Load repositories (placeholder for now, will fetch from API later)
  useEffect(() => {
    // TODO: Replace with real fetch: GET /api/profile/repositories
    const timer = setTimeout(() => {
      setRepos(PLACEHOLDER_REPOS);
      setLoading(false);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  // Set initial suggestions once repos load
  useEffect(() => {
    if (initialSuggestions.length > 0 && selected.length === 0) {
      setSelected(initialSuggestions);
    }
  }, [initialSuggestions, selected.length]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-600 border-t-emerald-400" />
        <span className="ml-3 text-sm text-slate-400">
          Loading repositories...
        </span>
      </div>
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
