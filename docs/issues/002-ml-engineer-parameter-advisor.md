# 002: ML Engineer Parameter and Configuration Advisor

**Milestone:** v0.3
**Status:** Planned
**GitHub issue:** [#2](https://github.com/EnesDemir143/expaudit/issues/2)

## Goal

Add an evidence-backed ML-engineer review layer that detects implausible, conflicting, missing, or ineffective training and data-loader parameters. It must explain trade-offs rather than label a larger batch size, more workers, or more jobs as universally better.

## Scope

- Extract parameters from YAML/JSON/TOML and AST-backed Python call facts: optimizer, learning rate, scheduler, weight decay, batch size, gradient accumulation, epochs, mixed precision, `num_workers`, `n_jobs`, pin memory, persistent workers, seed, device, and checkpoint cadence.
- Detect contradictions across manifest, config, and source: declared batch size differs from loader construction; device settings conflict; optimizer excludes parameters; scheduler is never stepped; CPU-only work uses unavailable GPU assumptions.
- Produce calibrated recommendations for throughput, memory pressure, convergence stability, data-loader saturation, and reproducibility.
- Make recommendations conditional on task, observed dataset shape/size, hardware evidence, and benchmark results when available.

## ML Engineer Review Prompt

The future advisory subagent receives only normalized facts and must follow this contract:

> You are an evidence-first Python ML engineer. Assess declared and observed training, optimizer, scheduler, batching, worker, parallelism, memory, and device configuration. Do not invent hardware, dataset, metrics, or results. Identify parameter mismatches and risky values with cited evidence. Explain trade-offs: larger batches can improve throughput but can exceed memory or alter optimization/generalization; more workers or `n_jobs` can saturate I/O or oversubscribe CPUs. Recommend a bounded experiment only when the required evidence is missing. Never execute project code or claim an improvement without a measured comparison.

## Non-Goals

- Replacing human model design decisions.
- Applying automatic hyperparameter edits.
- Treating a heuristic recommendation as a confirmed defect.

## Design Plan

1. Define a normalized parameter fact model with source, location, value, unit, and confidence.
2. Extend AST extraction to capture configured call arguments and limited intra-function flow, not regex-only matches.
3. Implement deterministic contradiction rules first; keep heuristic advice `review-required`.
4. Add a task-aware recommendation table with documented preconditions and counterexamples.
5. Consume microbenchmark evidence from issue 003 when it exists; otherwise state why a recommendation is unverified.

## Acceptance Criteria

- Config/source mismatches include both evidence references.
- Commented code and unrelated strings cannot create confirmed findings.
- Batch size, `num_workers`, and `n_jobs` recommendations always state a trade-off and evidence gap.
- Fixtures cover optimizer, scheduler, workers, batch sizing, CPU-only, CUDA, and MPS declarations.
