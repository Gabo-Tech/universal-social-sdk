---
name: Release checklist
about: Track required steps for a package release
title: "Release vX.Y.Z checklist"
labels: ["release"]
assignees: []
---

## Release metadata

- Target version: `vX.Y.Z`
- Release type: `patch | minor | major`

## Pre-release checks

- [ ] Version updated in `package.json`
- [ ] Changelog/release notes drafted
- [ ] `npm run build` passes
- [ ] `npm run test:unit` passes
- [ ] `npm run test:integration` reviewed (run if secrets/sandbox available)
- [ ] `npm pack --dry-run` reviewed for expected files only

## CI and publish readiness

- [ ] `NPM_TOKEN` is configured in repository secrets
- [ ] GitHub Actions CI is green on target commit
- [ ] Tag to publish is prepared: `vX.Y.Z`

## Publish

- [ ] Create and push tag:
  - `git tag vX.Y.Z`
  - `git push origin vX.Y.Z`
- [ ] Confirm `release.yml` workflow published package successfully
- [ ] Validate package page on npm

## Post-release

- [ ] Update GitHub release notes
- [ ] Announce release (if applicable)
- [ ] Start next development version (if needed)
