# Roadmap v1.1.0

This roadmap focuses on developer experience, production reliability, and better typed ergonomics.

## Goals

- Add webhook handling primitives.
- Add queue-friendly scheduling and dispatch support.
- Improve typed responses per platform.
- Add reusable pagination helpers.
- Keep API surface backward compatible with `1.0.x`.

## Scope

## 1) Webhooks Foundation

Status: Completed in `1.1.0` development cycle.

### Deliverables

- `src/webhooks/` module with:
  - signature verification helpers per platform where supported
  - normalized webhook event types
  - basic event parser and router
- Public exports from `src/index.ts`
- Docs section with examples

### Acceptance criteria

- Can verify and parse at least Meta + X style webhook signatures.
- Returns strongly typed normalized event payloads.
- Unit tests cover verification pass/fail and parser behavior.

## 2) Queue and Job Adapters

Status: Completed in `1.1.0` development cycle.

### Deliverables

- `src/queue/` module with a small adapter interface:
  - `enqueue(job)`
  - `schedule(job, runAt)`
  - `cancel(jobId)`
- In-memory adapter (default).
- Example adapter skeletons for BullMQ and SQS.

### Acceptance criteria

- Existing schedule methods can optionally delegate to queue adapter.
- Backward compatibility preserved for current in-process scheduling.
- Integration docs include worker + producer examples.

## 3) Stronger Typed Responses

Status: Completed in `1.1.0` development cycle.

### Deliverables

- Platform response interfaces for key methods:
  - publishing methods
  - analytics methods
  - list methods
- Generic API response wrapper where practical.

### Acceptance criteria

- Public `.d.ts` output exposes concrete return types (not broad `unknown`).
- No breaking change to existing method names/inputs.
- Unit tests assert typed shape usage in examples.

## 4) Pagination Utilities

### Deliverables

- `src/pagination/` helpers for cursor/page token iteration.
- Utilities:
  - `paginateAll(...)`
  - `paginateUntil(...)`
  - `takePage(...)`
- Platform wrappers updated for list endpoints that support pagination.

### Acceptance criteria

- Consumers can iterate full datasets without writing custom loops.
- Docs include one end-to-end example per style (cursor vs page token).

## 5) Documentation and Examples Upgrade

### Deliverables

- Add `examples/webhooks/` and `examples/queue/`.
- Add "Typed Responses" and "Pagination" sections in README.
- Extend integration matrix if new env vars are required.

### Acceptance criteria

- Each new module has at least one runnable example.
- README remains concise and links deep docs in `docs/`.

## Timeline

- Week 1: Webhooks foundation + tests
- Week 2: Queue adapters + scheduling integration
- Week 3: Typed responses + pagination helpers
- Week 4: Docs/examples polish + release candidate

## Risk Management

- Keep all new modules additive to avoid `2.0.0` breakage.
- Land work behind small PRs per module.
- Preserve existing method signatures unless absolutely required.

## v1.1.0 Release Checklist

- [ ] Scope complete and reviewed
- [ ] Build + unit tests green
- [ ] Integration tests updated and passing/skipped correctly
- [ ] README and docs updated
- [ ] `CHANGELOG.md` updated with `1.1.0` entry
- [ ] Version bump to `1.1.0`
- [ ] Tag `v1.1.0` pushed
