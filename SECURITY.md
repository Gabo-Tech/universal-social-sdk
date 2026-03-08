# Security Policy

## Supported Versions

Security fixes are applied to the latest released version.

## Reporting a Vulnerability

Please do not open public issues for security vulnerabilities.

Instead:

1. Use GitHub private vulnerability reporting if available.
2. If private reporting is unavailable, contact maintainers directly.

Include:

- Description of the issue
- Affected versions
- Reproduction steps or proof of concept
- Potential impact

## Response Timeline

- Initial acknowledgment: within 72 hours
- Triage and severity assessment: as soon as possible
- Fix and coordinated disclosure: based on severity and complexity

## Handling Secrets

- Never commit tokens, access keys, or `.env` files.
- Use repository secrets for CI and release workflows.
- Rotate compromised credentials immediately.

## Scope Notes

This SDK interacts with third-party APIs. Some security concerns may depend on provider-side permissions, app configuration, or account policies. Reports should clearly distinguish SDK-level issues from provider platform behavior.
