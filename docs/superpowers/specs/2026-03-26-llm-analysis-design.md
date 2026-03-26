# LLM Profile Analysis Design

Date: 2026-03-26
Status: Approved

## Overview

Replace the manual onboarding questionnaire with a GPT-4o-powered analysis step. After GitHub repos are imported, the LLM examines the user's repos, profile, and activity to auto-generate the full profile narrative — bio, headline, goals, archetype, featured project picks, and visual suggestions. The user reviews and edits everything on a new review page before generating the README.

## New Pipeline Flow

```
Sign in → Import GitHub repos → GPT-4o Analysis → Review & Edit Page → Confirm → Preview README
```

The questionnaire step is eliminated. The review page replaces it with pre-filled, editable fields.

## LLM Call: Single Structured Request

**Provider:** OpenAI GPT-4o
**Mode:** JSON output (`response_format: { type: "json_object" }`)
**One API call** with all repo data. Returns structured JSON matching the profile model input.

### Input to LLM

- GitHub login, name, bio
- All repos: name, description, language, stars, forks, pushed_at
- Pinned repos list

### Output from LLM (JSON)

```json
{
  "headline": "Hi, I'm Ash — an AI/ML engineer building agentic tools",
  "bio": "I build autonomous coding agents and AI-powered developer tools...",
  "goals": "Ship production-grade agentic systems...",
  "archetype": "ml",
  "experienceOutsideGitHub": null,
  "featuredProjectIds": ["123", "456", "789"],
  "featuredProjectReasons": {
    "123": "Your most starred and actively developed project",
    "456": "Shows your range across AI frameworks"
  },
  "visualSuggestions": {
    "showTimeline": true,
    "showLanguageBreakdown": true,
    "showActivityCard": true,
    "emphasisThemes": ["AI/ML", "Agentic Development", "Open Source"]
  },
  "voiceNotes": "Technical but approachable, builder-focused"
}
```

## Review & Edit Page (`/review`)

Replaces the questionnaire. All fields pre-filled by LLM, fully editable:

- **Headline** — text input
- **Bio** — textarea
- **Goals** — textarea
- **Archetype** — dropdown, pre-selected
- **Featured Projects** — LLM-picked with reasoning badges, user can toggle
- **Visual suggestions** — toggles for timeline, language card, activity card
- **Themes** — tag chips, add/remove
- **Voice notes** — textarea

Each field shows "AI suggested" indicator. User clicks "Generate README" to proceed to preview.

## Files

- `src/lib/analysis/analyze-profile.ts` — GPT-4o call, prompt, response parsing
- `src/app/(app)/review/page.tsx` — Review & edit page (server component)
- `src/components/review/review-form.tsx` — Client form with editable pre-filled fields
- `src/app/api/profile/analyze/route.ts` — API endpoint triggering analysis
- Modify onboarding flow routing: import → analyze → review → preview

## Constraints

- Requires `OPENAI_API_KEY` environment variable
- Falls back to existing heuristic logic if API key is missing or call fails
- Single API call per analysis (no chaining)
- Response must parse into the expected JSON shape or fall back gracefully
