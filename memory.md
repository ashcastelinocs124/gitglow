# Memory

## Current State (2026-03-25)

Tasks 1-3 of the V1 implementation plan are complete:
- **Task 1:** App scaffold (Next.js, Tailwind, Vitest, Playwright) - committed
- **Task 2:** Prisma data model (User, GitHubAccount, ImportedRepository, ProfileNarrative, FeaturedProject, ProfileGeneration, GeneratedAsset, PublishEvent) - committed
- **Task 3:** GitHub OAuth via NextAuth, protected dashboard route - committed

- **Task 4:** GitHub import layer (client, import-profile, normalization) - committed (5bd8bcf)
- **Task 5:** Questionnaire and narrative inputs (schema, form, onboarding page) - committed (bcfab8a)
- **Task 6:** Featured project selection (logic, picker UI, onboarding integration, 12 unit tests) - committed (92401c7)
- **Task 7:** Structured profile model (ProfileModel interface, buildProfileModel pure function, 20 unit tests) - committed (494e9e8)
- **Task 8:** README markdown composition (composeReadme, section builders, profileModelToReadmeInput, 20 unit tests) - committed (9e0f2b4)
- **Task 9:** Visual asset generation (SVG templates for activity/language/journey cards, generateAsset entry point, local storage adapter, 13 unit tests) - committed (69e24c9)

- **Task 10:** Asset serving route with last-good fallback (GET /api/assets/:assetId, saveLastGoodAsset, loadAssetWithFallback, loadAssetLocally returns null, 11 integration tests) - committed (77f6fbe)
- **Task 12:** Publish to GitHub profile README repo (buildPublishRequest, validatePublishRequest, executePublish, createProfileRepo, POST /api/readme/publish, manual+connected modes, 12 integration tests) - committed (abd7de4)
- **Task 13:** Refresh jobs for profile metrics and visuals (classifyRefreshPlan, buildRefreshActions, executeRefreshPlan, narrative-safe-by-default design, 13 integration tests) - committed (f8b5429)
- **Task 14:** Version history and rollback (selectRollbackTarget, canRollback, sortGenerationsByDate, getGenerationSummary, buildRollbackAction, HistoryList component, dashboard integration, 17 unit tests) - committed (aa4fcae)

- **Task 15:** Reliability guards and final checks (validateBeforePublish, describeRefreshType, validateAssetUrls, buildSyncFailureMessage, assertLastPublishedIntact, PublishStatus component, 25 unit tests) - committed

Next up: remaining task (11)

## Implementation Plan

Full plan at `docs/superpowers/plans/2026-03-25-gitglow-v1.md` (15 tasks total).
Design spec at `docs/superpowers/specs/2026-03-25-gitglow-design.md`.
