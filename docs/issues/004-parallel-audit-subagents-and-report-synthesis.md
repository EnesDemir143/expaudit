# 004: Parallel Audit Subagents and Deterministic Report Synthesis

**Milestone:** v0.4
**Status:** Planned
**GitHub issue:** [#1](https://github.com/EnesDemir143/expaudit/issues/1)

## Goal

Allow the agent workflow to investigate independent audit surfaces concurrently while producing one deterministic, evidence-backed final report.

## Parallel Workstreams

| Subagent | Inputs | Output | Prohibited Actions |
| --- | --- | --- | --- |
| Data analyst | Resolved manifest/data paths and bounded metadata | Format, scale, split, schema, and quality facts | Data mutation, network, unbounded reads |
| ML configuration engineer | Manifest, configs, AST facts | Parameter mismatches and conditional optimization advice | Runtime execution, unsupported claims |
| Runtime/benchmark analyst | Approved benchmark declaration and capabilities | Device availability, bounded results, comparability limits | Running without consent or exceeding limits |
| Artifact/tracker analyst | Local resolved artifacts | Metrics/checkpoint/tracker evidence | Remote access without network consent |

## Orchestrator Contract

1. Resolve and validate the manifest once before dispatch.
2. Give each subagent immutable, redacted, root-confined inputs.
3. Run only dependency-independent subagents concurrently.
4. Require each subagent to return a typed result: findings, observed fields, evidence, completed checks, unavailable checks, limits, and failure reason.
5. The synthesizer merges results in stable adapter order, deduplicates evidence, applies verdict rules once, and renders one report.
6. Subagents do not edit project files or directly close issues.

## Shared Prompt Requirements

Every future subagent prompt must state: evidence-first reasoning, no inferred clean state, no secret disclosure, no path escape, no execution without granted capability, and a structured JSON result contract. Prompts must be versioned and tested like public behavior.

## Acceptance Criteria

- Parallel and sequential execution produce semantically identical reports for the same fixture.
- One timeout/failure becomes bounded unavailable coverage without discarding other results.
- No two subagents write to the same report/evidence output.
- Tests cover ordering, malformed output, duplicate findings, capability denial, and partial failure.
