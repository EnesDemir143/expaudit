# ExpAudit Roadmap

This roadmap is planning-only. Each item has a solution plan in `docs/issues/` and a corresponding GitHub issue. Implementation begins only after the maintainer explicitly asks to reconsider and implement that issue's plan.

| Version | Planning Item | Focus | Status |
| --- | --- | --- | --- |
| v0.3 | [001](issues/001-format-aware-dataset-inventory.md) / [#4](https://github.com/EnesDemir143/expaudit/issues/4) | Format-aware dataset inventory and bounded profiling | Planned |
| v0.3 | [002](issues/002-ml-engineer-parameter-advisor.md) / [#2](https://github.com/EnesDemir143/expaudit/issues/2) | ML engineer parameter and configuration advisor | Planned |
| v0.4 | [003](issues/003-safe-cpu-cuda-mps-microbenchmarks.md) / [#3](https://github.com/EnesDemir143/expaudit/issues/3) | Safe microbenchmarking across CPU, CUDA, and MPS | Planned |
| v0.4 | [004](issues/004-parallel-audit-subagents-and-report-synthesis.md) / [#1](https://github.com/EnesDemir143/expaudit/issues/1) | Parallel audit subagents and deterministic report synthesis | Planned |
| v0.5 | [005](issues/005-extended-validation-adapters-and-tracker-evidence.md) / [#5](https://github.com/EnesDemir143/expaudit/issues/5) | Extended optional validation adapters and tracker-aware evidence | Planned |

## Delivery Rules

- Version labels express intended sequencing, not dates or release promises.
- Each issue has explicit non-goals, consent boundaries, acceptance criteria, and tests.
- A later issue may not bypass a prerequisite's safety contract.
- Benchmarking and hardware detection are opt-in capabilities, never implicit project-code execution.

See [Issue Workflow](ISSUE_WORKFLOW.md) for the required lifecycle.
