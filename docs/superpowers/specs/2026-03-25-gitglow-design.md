# Gitglow Design Spec

Date: 2026-03-25
Status: Draft approved in brainstorming

## Overview

Gitglow is a GitHub profile README generator that turns a developer's GitHub presence into a narrative portfolio. Instead of producing a generic badge wall or simple template, it combines GitHub-derived signals with user-authored context to generate a polished profile README with hosted visual assets such as graphs, cards, and journey summaries.

The output targets the user's GitHub profile README repository and supports two delivery modes:

- Manual export: generate markdown and hosted assets for the user to review and paste.
- Connected sync: connect GitHub and update the profile README automatically with user approval and refresh controls.

## Product Goal

Help developers present their work, progress, and identity more attractively than generic README generators by showing the full arc of their developer journey.

Primary differentiators:

- Narrative positioning instead of template filling
- Rich hosted graphs and cards embedded into the README
- A blend of GitHub activity data and user-supplied context
- Ongoing refreshes so the profile stays current without losing the user's voice

## User Problem

Existing profile README generators are often shallow and generic. They can show tools, badges, and simple stats, but they do a poor job of capturing:

- how a developer has evolved over time
- what kind of work they want to be known for
- which projects matter most
- experience and goals that are not obvious from GitHub data alone

Gitglow addresses this by combining data import, guided storytelling, and generated visuals into one coherent README output.

## Core User Inputs

Gitglow relies on two classes of input.

### 1. GitHub-derived signals

- Profile metadata
- Pinned repositories
- Repository metadata
- Contribution history
- Language mix and trends
- Stars, forks, and engagement patterns
- Recent activity and development cadence

### 2. User-authored context

- Bio and personal summary
- Career goals
- Skills to emphasize
- Featured projects
- Narrative framing for their journey
- Experience outside GitHub
- Preferred emphasis, such as backend, ML, product engineering, or indie building

## V1 Product Scope

V1 includes:

- GitHub OAuth connection
- GitHub profile and repository import
- Guided storytelling questionnaire
- Featured project selection
- README preview
- Hosted graphs and cards
- Refresh jobs for assets and selected content
- Manual export
- Optional connected auto-sync to the GitHub profile README repository
- Basic generation history
- Rollback to the last published version

V1 excludes:

- Full hosted developer portfolio sites
- Team or organization pages
- True per-view dynamic rendering
- Multi-platform social imports beyond GitHub
- Highly granular AI controls that make output unstable

## Recommended Product Shape

Gitglow should launch as a README-first product. The product promise should be direct:

"Connect GitHub, tell us your story, and get a polished profile README with refreshable visuals."

This keeps the initial value proposition narrow and concrete while leaving room to expand later into a broader portfolio layer.

## Delivery Modes

### Manual mode

The system generates markdown plus externally hosted assets. The user reviews the output and pastes it into GitHub manually.

### Connected mode

The user authorizes GitHub access. Gitglow can create or update the profile README repository and publish the generated output after preview and confirmation.

Both modes use the same import, insight, asset generation, and README composition pipeline.

## User Experience

### Onboarding flow

1. Connect GitHub
2. Import GitHub profile and repository data
3. Answer a short storytelling questionnaire
4. Select featured repositories and projects
5. Preview the generated README
6. Choose manual export or auto-sync

### Core UX principles

- The workflow should feel like building a narrative, not completing a form.
- The preview should show both rendered output and markdown output.
- Users should understand what is data-driven versus what is user-authored.
- Users should be able to refresh visuals separately from rewriting their story.

### Post-onboarding control panel

After setup, users should be able to:

- edit narrative inputs
- update featured content
- refresh visuals and metrics
- regenerate selected content
- export markdown
- enable or manage sync behavior
- review generation history

## System Architecture

The system is composed of five core services.

### 1. Auth and GitHub Integration

Responsibilities:

- OAuth flow
- permission management
- profile and repository import
- optional README repo write-back

### 2. Storytelling Layer

Responsibilities:

- collect user-authored context
- structure their goals and emphasis
- store profile preferences and narrative signals

### 3. Insight Engine

Responsibilities:

- transform raw GitHub data and user input into a structured profile model
- identify patterns such as strengths, growth, focus areas, and notable work
- prepare data for copy generation and visual generation

### 4. Asset Generation Service

Responsibilities:

- create hosted graphs, visual cards, and summary images
- refresh assets on schedule or on demand
- preserve the last known good assets if generation fails

### 5. README Composer

Responsibilities:

- generate GitHub-flavored markdown
- embed hosted visual assets
- produce export-ready or publish-ready output

## Structured Profile Model

The insight engine should not generate prose directly from raw API responses. It should first build a structured internal model, for example:

- developer archetype
- strengths
- journey timeline signals
- featured work
- language and activity metrics
- positioning preferences
- visual asset configuration

The copy generator and asset generator should consume this model. This separation improves consistency, supports refresh behavior, and reduces unstable output changes.

## Generation Logic

### Refresh-safe content

These can refresh more freely:

- graphs
- cards
- contribution and language summaries
- activity metrics
- repository stats

### Stable narrative content

These should only change with guardrails:

- about me copy
- positioning summary
- long-form journey narrative
- selected project emphasis

Narrative sections should remain stable unless:

- the user edits narrative inputs
- the user explicitly requests a rewrite
- the system applies a bounded regeneration rule the user has approved

## Hosted Assets Strategy

GitHub profile READMEs cannot rely on advanced frontend behavior, so Gitglow should use hosted images and cards embedded into markdown.

Key implications:

- generated visuals must have stable URLs
- refresh jobs update the underlying assets without breaking embeds
- the README remains compatible with GitHub-flavored markdown
- last-good asset fallback is required for resilience

V1 should use generated assets refreshed on demand or on schedule, rather than live rendering on every profile view.

## Sync and Publishing Model

Publishing should follow a trust-first workflow:

1. generate content
2. validate markdown and asset links
3. show preview
4. require confirmation before publish
5. update the GitHub profile README repository if connected mode is enabled
6. store a version for rollback

The system should distinguish between:

- safe refreshes: stats and visuals
- story rewrites: narrative content

Users should always know which type of update is about to occur.

## Trust and Error Handling

Because Gitglow affects a user's public developer identity, trust is a product requirement.

Required safeguards:

- preview before publish
- explicit change visibility
- minimal GitHub permission scopes
- generation history
- rollback to last published version
- sync failure transparency
- asset fallback behavior

Failure handling requirements:

- If GitHub sync fails, keep the last published profile intact.
- If asset generation fails, continue serving the last good asset version.
- If imports fail because of rate limits or temporary API problems, preserve cached data and show the issue clearly.
- Never silently overwrite curated user-facing copy.

## Data Flow

1. User connects GitHub.
2. Import service fetches GitHub profile and repository data.
3. User completes storytelling questionnaire and selects featured content.
4. Insight engine produces a structured profile model.
5. Copy generation creates README sections from that model.
6. Asset generation creates hosted visuals.
7. README composer assembles markdown with external asset embeds.
8. User previews the output.
9. User exports manually or publishes through connected sync.
10. Refresh jobs update metrics and visuals over time under controlled rules.

## Testing Strategy

### Integration tests

- GitHub OAuth flow
- repository discovery
- profile README repository detection
- markdown publish flow
- refresh job execution

### Generation tests

- snapshot tests for markdown structure
- stable section ordering
- graceful handling of sparse GitHub data
- graceful handling of missing optional user inputs

### Trust and reliability tests

- preview-before-publish enforcement
- rollback after failed sync
- asset fallback after generation failure
- distinction between safe refresh and story rewrite paths

## Open Product Decisions for Later

These items should remain out of the initial build but be kept in mind:

- whether to add a companion hosted portfolio page
- whether to support design themes and aesthetic presets
- whether to support recruiter-facing variants
- whether to extend imports to platforms beyond GitHub

## Summary

Gitglow should begin as a README-first product that transforms GitHub activity and personal narrative into a polished, refreshable GitHub profile README. The product wins by producing a stronger story and better visuals than generic README generators while maintaining user trust through preview, stable narrative guardrails, and safe publishing controls.
