# How This NPM Package Works

This guide explains the package lifecycle from development to consumption.

## 1) Package metadata (`package.json`)

`package.json` defines:

- Package identity (`name`, `version`, `license`).
- Runtime format (`type: module` for ESM).
- Entry points (`main`, `types`, `exports`).
- CLI binary mapping (`bin.universal-social-sdk`).
- Build/test scripts.
- Runtime dependencies vs dev dependencies.

## 2) Build pipeline

Commands:

- `npm run build`
  - Uses `tsup` to compile TypeScript from `src/` into `dist/`.
  - Emits ESM JavaScript and `.d.ts` type declarations.

- `npm run typecheck`
  - Runs TypeScript checking without emit.

- `npm run test` / `npm run test:unit` / `npm run test:integration`
  - Runs Vitest suites.

## 3) What gets published

The `files` field restricts publish output to:

- `dist`
- `README.md`
- `.env.example`
- `supported-methods.json`

This keeps the npm tarball small and avoids shipping local dev files.

## 4) Installation experience for consumers

When a user runs:

```bash
npm install universal-social-sdk
```

They receive prebuilt artifacts from `dist/`. Their app imports:

```ts
import { X, Instagram, Facebook, LinkedIn } from "universal-social-sdk";
```

At runtime:

- `.env` is auto-loaded via `dotenv`.
- Static async platform methods perform validated API calls.
- Retry/error normalization happens internally.

## 5) CLI usage model

The package exposes a CLI binary:

```bash
npx universal-social-sdk init
npx universal-social-sdk update
```

- `init` helps first-time setup.
- `update` runs the docs-to-patch flow with local Ollama.

## 6) CI and release model

- `ci.yml`
  - Build + unit tests for all pushes/PRs.
  - Integration tests only when platform secrets are set.

- `release.yml`
  - Publishes to npm when a `v*` tag is pushed or manual publish is triggered.
  - Requires `NPM_TOKEN`.

## 7) Publish checklist

Before publishing:

1. Bump version in `package.json`.
2. Run:
   - `npm run build`
   - `npm run test`
3. Commit changes.
4. Create a version tag (example: `v1.0.1`).
5. Push tag to trigger release workflow.

## 8) Consumer compatibility notes

- Node `>=18.18.0`.
- ESM-only package.
- Credentials must be provided through env vars.
- Some endpoints require provider-specific app review or additional scopes.
