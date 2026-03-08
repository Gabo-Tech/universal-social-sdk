# Test Suite Scaffold

## Unit tests

- `tests/unit/validation.test.ts`: runtime input validation guarantees.
- `tests/unit/retry.test.ts`: retry/backoff behavior for retryable and non-retryable errors.
- `tests/unit/patcher.test.ts`: updater path safety guardrails.

## Integration tests

Platform integration templates:

- `tests/integration/x.test.ts`
- `tests/integration/facebook.test.ts`
- `tests/integration/instagram.test.ts`
- `tests/integration/linkedin.test.ts`
- `tests/integration/youtube.test.ts`
- `tests/integration/tiktok.test.ts`
- `tests/integration/pinterest.test.ts`
- `tests/integration/bluesky.test.ts`
- `tests/integration/mastodon.test.ts`
- `tests/integration/threads.test.ts`

How gating works:

1. Tests load `.env.test` first, then `.env`.
2. Each platform suite auto-skips unless required credentials are present.
3. Add sandbox credentials in `.env.test` (use `.env.test.example` as template).

Commands:

- `npm run test:unit`
- `npm run test:integration`
- `npm test`
