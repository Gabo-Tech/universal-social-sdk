# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Non-interactive updater mode for CI/automation (`--ci`, `--open-pr`, `--branch-prefix`, `--base`, `--artifacts-dir`).
- Structured updater artifacts (`.artifacts/update-plan.json`, `.artifacts/update-diff-summary.json`, `.artifacts/pr-title.txt`, `.artifacts/pr-body.md`).
- Strict Ollama patch-plan schema validation with typed `changes` metadata (platform, endpoint, change type, confidence).
- Scheduled PR automation workflow: `.github/workflows/auto-update-pr.yml`.
- Workflow-dispatch `dry_run` mode for updater automation (detect and generate artifacts without opening PRs).
- Unit tests covering updater plan validation and no-change detection behavior.

### Changed

- Updater CI mode now enforces `npm run build` and `npm run test:unit` before PR automation proceeds.
- Auto-update PR workflow now excludes `.artifacts/*` from commits while still using artifacts for PR metadata.

## [1.1.0] - 2026-03-08

### Added

- `src/webhooks` module with:
  - Meta and X signature verification helpers
  - normalized webhook event parsing helpers
  - `WebhookRouter` for typed and wildcard event dispatch
- Unit tests for webhook verification, normalization, and routing.
- `src/queue` module with:
  - `QueueAdapter` interface
  - `InMemoryQueueAdapter`
  - skeleton adapters for BullMQ and SQS
  - queue adapter registry (`setQueueAdapter`, `getQueueAdapter`, `resetQueueAdapter`)
- Scheduler integration to route scheduled jobs through the active queue adapter.
- Unit tests for queue adapter registry and scheduler behavior.
- Added typed response interfaces and explicit return contracts across all public platform methods.
- Refined response contracts with platform-specific action/delete/result aliases for stronger API clarity.
- Added internal normalized result helpers so action/delete/mutation/detail responses remain stable even if upstream provider payloads drift.
- Added `docs/RESPONSE_CONTRACTS.md` with stable contract reference and integration guidance.
- Exported response interfaces from package root.
- Unit test coverage for typed response shapes.

## [1.0.1] - 2026-03-08

### Added

- Runtime validation for public platform methods.
- Integration test scaffolding for all supported platforms.
- Repository governance files (`CODE_OF_CONDUCT.md`, `SECURITY.md`, `LICENSE`).
- Examples folder with runnable scripts.
- Package metadata fields (`homepage`, `bugs`, `funding`) in `package.json`.

### Changed

- CI and release workflow gating behavior for clearer run outcomes.
- Documentation coverage for platform matrix, testing, and project structure.

## [1.0.0] - 2026-03-08

### Added

- Initial public release of `universal-social-sdk`.
- Unified static async APIs for:
  - X
  - Facebook
  - Instagram
  - LinkedIn
  - YouTube
  - TikTok
  - Pinterest
  - Bluesky
  - Mastodon
  - Threads
- CLI:
  - `universal-social-sdk init`
  - `universal-social-sdk update`
- Build + type declarations via TypeScript + tsup.
- Unit and integration test scaffolding.
- GitHub Actions CI and npm release automation.
- Comprehensive setup and usage documentation.
