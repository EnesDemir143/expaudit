# 003: Safe CPU, CUDA, and MPS Microbenchmarking

**Milestone:** v0.4
**Status:** Planned
**GitHub issue:** [#3](https://github.com/EnesDemir143/expaudit/issues/3)

## Goal

Offer a consent-gated, reproducible microbenchmark adapter that can compare a small, manifest-declared workload across CPU, CUDA, and Apple MPS when available. Its purpose is to measure a narrow configuration choice, not to run a full training job or promise a production speedup.

## Required Research Before Implementation

- Verify current PyTorch CPU/CUDA/MPS capability discovery and synchronization semantics from official PyTorch documentation.
- Verify memory measurement APIs and known MPS/CUDA limitations for the supported PyTorch versions.
- Evaluate CPU thread controls, DataLoader workers, device transfer timing, warm-up, seed control, and autocast behavior.
- Record findings and source versions in the implementation issue before selecting APIs.

## Scope

- Require manifest declaration, `runtime`, `install`, and `network` consent when dependencies need downloading; require `gpu` for CUDA or MPS.
- Use an external isolated environment and a bounded, allowlisted module/factory/sample input.
- Run warm-up plus a fixed small number of iterations or epochs, with wall time, throughput, peak memory where available, device, package versions, seed, and limits captured as evidence.
- Compare candidate settings such as batch size, gradient accumulation, workers, `n_jobs`, and device only one controlled change at a time.
- State non-comparability when hardware, memory budget, input, seed, software version, or preprocessing differ.

## Non-Goals

- Benchmarking by default, long training runs, automatic tuning, cloud provisioning, or changing project files/environments.
- Claiming accuracy, convergence, or cost improvements from throughput alone.

## Design Plan

1. Add a benchmark manifest block with explicit workload, candidate matrix, maximum iterations/epochs, time/memory ceilings, and desired devices.
2. Create device discovery that records availability without selecting a device implicitly.
3. Implement a bounded runner with timeouts, output caps, stripped credentials, cleanup, and structured results.
4. Add a comparison analyzer that reports speed, memory, instability, and measurement uncertainty separately.
5. Add mocked tests for CPU-only, CUDA unavailable, MPS unavailable, denied consent, timeout, out-of-memory, and incomparable runs.

## Acceptance Criteria

- No project environment is activated, reused, deleted, or mutated.
- GPU is never used without explicit consent.
- Every result contains enough hardware/software/limit metadata to evaluate comparability.
- Recommendations never claim that larger batches or more workers are unconditionally beneficial.
