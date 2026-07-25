# Changelog

All notable changes to ExpAudit are documented in this file.

## [0.2.2] - 2026-07-26

### Fixed

- Build runner assets before integration tests so clean CI and release checkouts can validate skill installation.

## [0.2.1] - 2026-07-26

### Added

- Strict versioned `experiment.md` manifests, path resolution, observed-evidence extraction, and declared-versus-observed reporting.
- Static Python ML checks, local artifact/tracker evidence, optional adapter selection, and isolated runtime probe support.
- Bundled internal skill runner and strict experiment template generation.
- Project roadmap, issue workflow, and implementation plans for planned v0.3-v0.5 audit capabilities.
- Contributor, code-of-conduct, security, and support guidance.

### Changed

- MIT copyright notice now identifies Enes Demir as the 2026 copyright holder.

## [0.1.2] - 2026-07-25

### Fixed

- CLI version output now reads the installed package version.

## [0.1.1] - 2026-07-25

### Changed

- Release workflow now publishes public npm packages through GitHub Actions OIDC Trusted Publishing.

## [0.1.0] - 2026-07-25

### Added

- Evidence-backed ML experiment review engine with a shared request, contract, finding, coverage, and verdict model.
- Read-only chat and repository-health reviews, persistent sibling Markdown reviews, comparisons, JSON, and SARIF output.
- Static checks for leakage, evaluation misuse, loss misuse, and train-serving skew.
- `expaudit` CLI with Claude Code, OpenCode, Antigravity, Kilo, and generic Agent Skills installation targets.
- Canonical `ml-experiment-review` Agent Skill and GitHub Actions validation.
