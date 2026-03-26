# LLM Profile Analysis Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the manual questionnaire with a GPT-4o analysis step that auto-generates the user's profile narrative from their GitHub data, presented on a review & edit page.

**Architecture:** Install the OpenAI SDK. Create an analysis module that sends GitHub import data to GPT-4o with JSON mode, parses the structured response into the existing `QuestionnaireData` shape plus visual suggestions. Add a new `/review` page that shows pre-filled editable fields. Wire the flow: import → analyze → review → preview.

**Tech Stack:** OpenAI SDK (`openai`), existing Next.js App Router, existing Tailwind dark theme, existing in-memory store

---

## Task 1: Install OpenAI SDK and Add API Key

**Files:**
- Modify: `package.json`
- Modify: `.env.local`

- [ ] **Step 1: Install the SDK**

Run: `npm install openai`

- [ ] **Step 2: Add the API key to env**

Add to `.env.local`:
```
OPENAI_API_KEY=<user's key>
```

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add openai sdk"
```

## Task 2: Build the Profile Analyzer

**Files:**
- Create: `src/lib/analysis/analyze-profile.ts`
- Create: `tests/unit/analyze-profile.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from "vitest";

describe("profile analysis", () => {
  it("exports analyzeProfile and AnalysisResult type", async () => {
    const mod = await import("@/lib/analysis/analyze-profile");
    expect(mod.analyzeProfile).toBeDefined();
  });

  it("buildAnalysisPrompt produces a string with repo data", async () => {
    const { buildAnalysisPrompt } = await import("@/lib/analysis/analyze-profile");
    const prompt = buildAnalysisPrompt({
      profile: { login: "octocat", name: "Octo", bio: "I code", avatarUrl: null, profileUrl: null, followers: 10, following: 5, publicRepos: 3 },
      repositories: [
        { githubRepoId: "1", name: "hello-world", ownerLogin: "octocat", description: "A test repo", primaryLanguage: "JavaScript", stars: 5, forks: 1, isPinned: false, pushedAt: new Date("2026-01-01") },
      ],
    });
    expect(prompt).toContain("octocat");
    expect(prompt).toContain("hello-world");
    expect(prompt).toContain("JavaScript");
  });

  it("parseAnalysisResponse extracts structured fields", async () => {
    const { parseAnalysisResponse } = await import("@/lib/analysis/analyze-profile");
    const result = parseAnalysisResponse(JSON.stringify({
      headline: "Hi, I'm Octo",
      bio: "I build things",
      goals: "Ship more OSS",
      archetype: "fullstack",
      featuredProjectIds: ["1"],
      featuredProjectReasons: { "1": "Most popular" },
      visualSuggestions: { showTimeline: true, showLanguageBreakdown: true, showActivityCard: true, emphasisThemes: ["OSS"] },
      voiceNotes: "Casual tone",
    }));
    expect(result.headline).toBe("Hi, I'm Octo");
    expect(result.bio).toBe("I build things");
    expect(result.archetype).toBe("fullstack");
    expect(result.featuredProjectIds).toEqual(["1"]);
    expect(result.visualSuggestions.emphasisThemes).toContain("OSS");
  });

  it("parseAnalysisResponse returns fallback for malformed JSON", async () => {
    const { parseAnalysisResponse } = await import("@/lib/analysis/analyze-profile");
    const result = parseAnalysisResponse("not json at all");
    expect(result.headline).toBeTruthy();
    expect(result.archetype).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/analyze-profile.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement the analyzer**

`src/lib/analysis/analyze-profile.ts`:

- `AnalysisResult` interface: headline, bio, goals, archetype, experienceOutsideGitHub, featuredProjectIds, featuredProjectReasons, visualSuggestions (showTimeline, showLanguageBreakdown, showActivityCard, emphasisThemes), voiceNotes
- `buildAnalysisPrompt(importData: NormalizedImportPayload): string` — builds the system+user prompt with all repo data serialized
- `parseAnalysisResponse(raw: string): AnalysisResult` — JSON.parse with fallback to heuristic defaults on failure
- `analyzeProfile(importData: NormalizedImportPayload): Promise<AnalysisResult>` — calls OpenAI GPT-4o with JSON mode, returns parsed result. Falls back to heuristic defaults if OPENAI_API_KEY is missing or call fails.
- `buildFallbackAnalysis(importData: NormalizedImportPayload): AnalysisResult` — heuristic-only fallback (uses existing archetype inference logic)

The prompt should instruct GPT-4o to:
1. Analyze the developer's repos for patterns, themes, strengths
2. Identify their developer archetype
3. Write a compelling headline and bio
4. Pick the best 3-6 repos to feature, with a reason for each
5. Suggest which visual cards to show and key themes
6. Return valid JSON matching the AnalysisResult shape

- [ ] **Step 4: Run tests**

Run: `npx vitest run tests/unit/analyze-profile.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/analysis/analyze-profile.ts tests/unit/analyze-profile.test.ts
git commit -m "feat: add GPT-4o profile analyzer"
```

## Task 3: Add the Analysis API Endpoint

**Files:**
- Create: `src/app/api/profile/analyze/route.ts`

- [ ] **Step 1: Implement the endpoint**

POST `/api/profile/analyze`:
- Requires authenticated session with accessToken
- Imports GitHub data (or reads from store)
- Calls `analyzeProfile(importData)`
- Stores the analysis result in the in-memory store (add `analysisResult` field to UserStore)
- Returns the analysis result as JSON

- [ ] **Step 2: Update the store**

Add to `src/lib/store.ts`:
- Import `AnalysisResult` type
- Add `analysisResult?: AnalysisResult` to `UserStore` interface
- Add `setAnalysisResult(email, result)` function

- [ ] **Step 3: Commit**

```bash
git add src/app/api/profile/analyze/route.ts src/lib/store.ts
git commit -m "feat: add profile analysis API endpoint"
```

## Task 4: Build the Review & Edit Page

**Files:**
- Create: `src/app/(app)/review/page.tsx`
- Create: `src/components/review/review-form.tsx`

- [ ] **Step 1: Create the review form client component**

`src/components/review/review-form.tsx` ("use client"):
- Props: `{ analysis: AnalysisResult, repositories: { id: string, name: string, stars: number, description: string | null, language: string | null }[] }`
- Pre-filled fields for: headline (text input), bio (textarea), goals (textarea), archetype (dropdown from ARCHETYPE_OPTIONS), voiceNotes (textarea)
- Featured projects section: show LLM-picked repos with reasoning badges, checkboxes to toggle
- Visual suggestions: toggles for showTimeline, showLanguageBreakdown, showActivityCard
- Themes: tag chips from emphasisThemes, add/remove
- "AI suggested" badge on each field
- "Generate README" button that POSTs all data to `/api/profile/questionnaire` + `/api/profile/featured` and redirects to `/preview`
- Dark theme: bg-slate-950, text-slate-50, emerald accents

- [ ] **Step 2: Create the review page server component**

`src/app/(app)/review/page.tsx`:
- Check session (redirect if not auth)
- Read import data from store (redirect to onboarding if none)
- Read analysis result from store
- If no analysis yet, trigger it server-side by calling `analyzeProfile`
- Pass analysis + repositories to ReviewForm
- Title: "Review your profile" with subtitle about AI-generated suggestions

- [ ] **Step 3: Commit**

```bash
git add "src/app/(app)/review/page.tsx" src/components/review/review-form.tsx
git commit -m "feat: add AI review and edit page"
```

## Task 5: Wire the New Flow

**Files:**
- Modify: `src/app/(app)/onboarding/page.tsx`
- Modify: `src/app/(app)/dashboard/page.tsx`
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Update onboarding to auto-import then redirect to /review**

Change the onboarding page to:
1. Import GitHub data on load (via the API)
2. Redirect to `/review` (skip the questionnaire)

Or simpler: make the "Get started" / "Tell your story" links go directly to `/review`, which handles the import + analysis internally.

- [ ] **Step 2: Update dashboard quick actions**

Change "Tell your story" card to link to `/review` instead of `/onboarding`.

- [ ] **Step 3: Update nav links**

Change "Edit story" links in preview and dashboard nav to point to `/review`.

- [ ] **Step 4: Commit**

```bash
git add "src/app/(app)/onboarding/page.tsx" "src/app/(app)/dashboard/page.tsx" src/app/page.tsx
git commit -m "feat: wire import → analyze → review → preview flow"
```

## Verification

After all tasks:
- Run: `npx vitest run` — all tests pass
- Run: `npx tsc --noEmit` — zero errors
- Manual test: sign in → land on dashboard → click "Tell your story" → see AI-analyzed review page with pre-filled fields → edit fields → click "Generate README" → see preview with real data
