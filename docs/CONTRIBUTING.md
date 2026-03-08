# Contributing

Thanks for contributing to `universal-social-sdk`.

This guide explains the expected workflow for code changes, tests, and releases.

## Prerequisites

- Node.js `>=18.18.0`
- npm
- Optional for updater work: local model runtime

## Local setup

1. Install dependencies:

```bash
npm ci
```

2. Build once:

```bash
npm run build
```

3. Run tests:

```bash
npm run test:unit
```

## Branch and PR workflow

1. Create a feature branch from the default branch.
2. Make focused changes.
3. Run:
   - `npm run build`
   - `npm run test:unit`
4. Open a PR with:
   - what changed
   - why it changed
   - how it was validated

## Coding standards

- Keep package ESM-only.
- Prefer small, composable helpers over duplicated platform logic.
- Keep cross-cutting concerns centralized:
  - validation in `src/validation`
  - retries in `src/utils/retry.ts`
  - normalized errors in `src/errors/SocialError.ts`
- Avoid broad refactors in the same PR as behavior changes.
- Use clear names and keep comments minimal.

## Validation requirements

For any new public platform method:

1. Add runtime schema in `src/validation/platformSchemas.ts`.
2. Validate method input in the platform method.
3. Ensure failures return `SocialError` consistently.
4. Add or update tests.

## Test strategy

### Unit tests

Run on every change:

```bash
npm run test:unit
```

### Integration tests

Integration tests are secret-gated and designed for sandbox accounts:

```bash
npm run test:integration
```

To run locally:

1. Copy `.env.test.example` to `.env.test`.
2. Fill sandbox credentials only.

Do not use production social accounts for integration tests.

## Updater development

If you modify updater internals (`src/updater/*`, `src/cli/commands/update.ts`):

- verify path safety constraints remain intact
- run:
  - `npm run test:unit`
  - `npm run build`
- test dry-run behavior:

```bash
npx universal-social-sdk update --dry-run
```

## Release process

1. Ensure CI passes.
2. Bump version in `package.json`.
3. Update docs/changelog notes.
4. Tag release:

```bash
git tag vX.Y.Z
git push origin vX.Y.Z
```

5. GitHub `release.yml` publishes package when `NPM_TOKEN` is configured.

## Security and secrets

- Never commit `.env`, `.env.test`, or token values.
- Use GitHub repository secrets for CI integration tests and npm publish.
