# Contributing to ExpAudit

ExpAudit is an evidence-backed audit platform for Python ML experiments. Contributions must preserve deterministic behavior, repository confinement, secret redaction, and explicit user consent for writes, network access, dependency installation, runtime execution, and GPU use.

## Planning First

1. Open or select a GitHub issue.
2. Create or update its corresponding `docs/issues/NNN-*.md` plan before implementation.
3. Keep the issue in planning until the plan has been reviewed.
4. Implement only after the maintainer explicitly requests reconsideration and implementation of that plan.
5. Run the plan's acceptance tests and required repository validation.
6. Link the implementation, test evidence, and follow-up risks in the issue before closing it.

Do not close an issue merely because code was written. Close it only when acceptance criteria, tests, documentation, and security constraints are verified.

## Development Standards

- Keep static analysis read-only; never import or execute target-project modules in a static rule.
- Treat missing, oversized, inaccessible, or ambiguous evidence as unavailable, never clean.
- Require evidence for every `confirmed` finding.
- Keep paths repository-confined and reject symlinks for resolved executable inputs.
- Keep runtime benchmarks opt-in, bounded, reproducible, and isolated from project environments.
- Add focused fixtures for regressions, especially false positives and unsafe execution paths.

## Validation

Run these before requesting review:

```bash
npm test
npm run lint
npm run build
npm run validate-skill
```

Run `npm pack --dry-run` for changes to packaging, installer behavior, schemas, or runner assets.

## Pull Requests

- Use one issue-focused change set where practical.
- Explain capability requirements and safety implications.
- Link the matching `docs/issues/` plan and GitHub issue.
- Do not include credentials, raw sensitive samples, proprietary dataset rows, or unredacted tracker metadata.
