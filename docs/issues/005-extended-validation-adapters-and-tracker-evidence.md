# 005: Extended Validation Adapters and Tracker Evidence

**Milestone:** v0.5
**Status:** Planned
**GitHub issue:** [#5](https://github.com/EnesDemir143/expaudit/issues/5)

## Goal

Expand optional local validation while keeping the core audit useful without external tools. Normalize third-party evidence into the existing finding and coverage model instead of treating tool presence as proof of correctness.

## Scope

- Add optional, separately selectable adapters for Pandera or Great Expectations-compatible checks, Deepchecks-compatible checks, Ruff, Pyright, Semgrep, pip-audit/OSV, and local MLflow/W&B/DVC metadata.
- Normalize native JSON/SARIF outputs with tool version, bounded command evidence, source location, severity mapping, and malformed-output handling.
- Improve local tracker extraction for metrics, parameters, tags, artifacts, dataset version, and checkpoint linkage.
- Treat remote trackers and advisory databases as explicit network-capability work.

## Non-Goals

- Installing tools during a default audit.
- Replacing deterministic ExpAudit checks with a third-party pass/fail result.
- Sending repository data to a remote service without consent.

## Design Plan

1. Define adapter-specific schemas and fixtures before command execution support.
2. Add a registry that selects only manifest-declared adapters and records absent/denied/malformed/timeout states.
3. Preserve local-only behavior as the default; layer network access behind separate adapter plans.
4. Add comparison extraction for tracker parameters versus manifest/config declarations.
5. Add contract tests for every normalized status and coverage outcome.

## Acceptance Criteria

- Missing optional tools do not block a verdict.
- Missing manifest-required tools do block with evidence-backed unavailable coverage.
- Remote access cannot occur without network consent.
- Malformed native output never becomes a false confirmed finding.
