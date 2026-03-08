# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
