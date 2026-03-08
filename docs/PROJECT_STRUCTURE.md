# Project Structure

This document explains how `universal-social-sdk` is organized and where each responsibility lives.

## High-level layout

- `src/index.ts`
  - Public entrypoint for consumers.
  - Loads env config and re-exports platform classes and shared types/errors.

- `src/platforms/`
  - One file per platform facade:
    - `x.ts`
    - `facebook.ts`
    - `instagram.ts`
    - `linkedin.ts`
    - `youtube.ts`
    - `tiktok.ts`
    - `pinterest.ts`
    - `bluesky.ts`
    - `mastodon.ts`
    - `threads.ts`
  - These classes define the public SDK methods.
  - All methods are static async methods.

- `src/platforms/shared/`
  - Shared internal platform helpers:
    - `metaClient.ts`: common Meta Graph/Business SDK call wrapper.
    - `linkedinAuth.ts`: token refresh + LinkedIn headers.

- `src/config/`
  - `env.ts`: dotenv bootstrap and typed environment variable access.

- `src/errors/`
  - `SocialError.ts`: normalized error type across all providers.

- `src/utils/`
  - `retry.ts`: retry logic with backoff/jitter and retryable status handling.
  - `scheduler.ts`: lightweight in-process scheduling utility.
  - `file.ts`: file metadata and stream helpers for uploads.

- `src/validation/`
  - `platformSchemas.ts`: runtime `zod` schemas for all public method inputs.
  - Keeps input validation centralized and consistent.

- `src/cli/`
  - `index.ts`: command registration (`init`, `update`).
  - `commands/init.ts`: first-use bootstrap for env files and OAuth links.
  - `commands/update.ts`: doc crawl + local model generation + diff/apply flow.

- `src/updater/`
  - `docCrawler.ts`: pulls official docs and extracts text/tables.
  - `ollama.ts`: prompts a local model runtime and parses patch plan.
  - `patcher.ts`: computes diffs and applies safe, path-restricted file updates.

- `tests/`
  - `unit/`: deterministic unit tests for validation/retry/patch safety.
  - `integration/`: secret-gated smoke tests per platform.
  - `helpers/`: env loading and gating helpers.

- `.github/workflows/`
  - `ci.yml`: build/unit test on push/PR; integration tests when secrets exist.
  - `release.yml`: npm publish flow on tags/manual trigger.

## Request flow for an SDK method

Example: `Instagram.uploadReel(...)`

1. Consumer imports from `universal-social-sdk`.
2. Method input is validated by `platformSchemas.ts`.
3. Method calls platform-specific implementation in `src/platforms/instagram.ts`.
4. Underlying API call is delegated to shared client helper (`metaClient.ts`).
5. Call is executed through retry wrapper (`withRetries`).
6. Any provider error is normalized into `SocialError`.
7. Result is returned to consumer.

## Why this structure

- Keeps public API layer clean and predictable.
- Centralizes cross-cutting concerns (validation, retry, errors).
- Makes future platform updates isolated and testable.
- Supports self-updater automation without coupling it to runtime SDK code.
