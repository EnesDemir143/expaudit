# 001: Format-Aware Dataset Inventory and Bounded Profiling

**Milestone:** v0.3
**Status:** Planned
**GitHub issue:** [#4](https://github.com/EnesDemir143/expaudit/issues/4)

## Goal

Extend data evidence beyond CSV and JSON manifests. Audit the repository `data/` area and manifest-declared data paths to report safe metadata, storage format, approximate scale, and bounded quality signals without loading an entire sensitive dataset.

## Scope

- Detect declared and conventional dataset locations under repository confinement, including `data/`.
- Classify CSV, JSON, JSONL, Parquet, NPY/NPZ, HDF5/H5, Zarr, image folders, and unknown binary formats.
- Report file counts, byte totals, shape/schema metadata when available, partition naming, split keys, null/duplicate summaries, label distribution summaries, and sampling limits.
- Use format-specific, read-only readers with row/byte/object limits and redacted evidence.
- Treat unsupported, remote, encrypted, oversized, ambiguous, or inaccessible data as `not-executable`, never as clean.

## Non-Goals

- Downloading datasets, following external links, rewriting data, or fully scanning unbounded artifacts.
- Training a model or using dataset data as executable instructions.
- Claiming semantic dataset suitability from metadata alone.

## Design Plan

1. Add a `data-inventory` adapter that receives only manifest-resolved, non-symlink paths and bounded discovery metadata.
2. Create format handlers behind a shared summary contract: `format`, `size`, `bounded`, `limits`, `schema`, `splitEvidence`, `qualityEvidence`, and `unavailableReason`.
3. Start with metadata-only support for HDF5, Zarr, NPY/NPZ, and Parquet. Add content sampling only when the reader can enforce hard limits.
4. Compare observed split/group/label facts with manifest declarations. Preserve both declared and observed evidence in mismatches.
5. Add fixtures for each format, malformed files, oversized inputs, split overlap, duplicate rows, and label imbalance.

## Acceptance Criteria

- Every supported format is identified without executing repository code.
- All readers enforce explicit byte/row/object limits and emit those limits in evidence.
- Symlink and root-escape fixtures are rejected.
- Unsupported or oversized data lowers coverage rather than producing a pass.
- `npm test`, lint, build, skill validation, and package dry-run pass.

## Dependencies and Risks

Evaluate portable, maintained readers before adding dependencies. Native dependencies and unbounded decompression are a security and distribution risk; prefer metadata-first implementations.
